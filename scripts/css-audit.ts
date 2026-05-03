// Audit de CSS huérfano.
//
// Compara las clases definidas en src/styles/main.css contra todas las
// clases efectivamente usadas en el HTML construido (_site/) y en JS
// inline (classList.add). Reporta candidatos a clase huérfana — clases
// definidas en CSS que no aparecen en ningún sitio.
//
// IMPORTANTE: la lista es de candidatos, no de basura confirmada. Algunas
// clases pueden ser falsos positivos de la regex (extensiones de archivo
// dentro de url(), comentarios). Otras pueden añadirse dinámicamente desde
// código que la regex no detecta. Revisar antes de borrar.
//
// Uso: deno task css-audit

import { walk } from "jsr:@std/fs@^1/walk";

const CSS_FILE = "./src/styles/main.css";
const SITE_DIR = "./_site";

// Falsos positivos típicos del regex .clase: extensiones de archivo,
// versiones, etc. Si un nombre acaba en cualquiera de estos, lo ignoramos
// como candidato — no es una clase real.
const FALSE_POSITIVE_SUFFIXES = new Set([
  // No usamos esto realmente porque el regex requiere identificador CSS
]);

// Clases que sabemos que se añaden dinámicamente desde JS, fuera del HTML
// estático. Si aparecen aquí, las consideramos usadas aunque la búsqueda
// en HTML no las detecte. Mantener manualmente.
const KNOWN_DYNAMIC = new Set<string>([
  "loaded", // LQIP: añadida en onload por _config.ts
]);

interface ClassRef {
  name: string;
  lines: number[];
}

// Extrae las clases definidas en un fichero CSS. Heurística: cualquier
// .ident donde ident empieza por letra/_ y sigue con [a-zA-Z0-9_-]. Salta
// las que estén dentro de comentarios /* ... */, url(...) y strings.
function extractCssClasses(content: string): Map<string, number[]> {
  // Stripeamos comentarios, url() y strings antes de buscar clases.
  // Reemplazamos por espacios para preservar líneas/columnas.
  const stripped = content
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/url\([^)]*\)/g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/"[^"\n]*"/g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/'[^'\n]*'/g, (m) => m.replace(/[^\n]/g, " "));

  const classes = new Map<string, number[]>();
  const lines = stripped.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matches = line.matchAll(/\.([a-zA-Z_][a-zA-Z0-9_-]*)/g);
    for (const m of matches) {
      const cls = m[1];
      if (!classes.has(cls)) classes.set(cls, []);
      classes.get(cls)!.push(i + 1);
    }
  }
  return classes;
}

// Extrae clases usadas en HTML: class="foo bar", class=foo (post-minify),
// y classList.add('foo') / classList.add("foo") en scripts inline.
async function extractUsedClasses(dir: string): Promise<Set<string>> {
  const used = new Set<string>();
  for await (
    const entry of walk(dir, { exts: [".html"] })
  ) {
    if (!entry.isFile) continue;
    const content = await Deno.readTextFile(entry.path);

    // class="foo bar baz", class='foo', class=foo (sin comillas tras minify)
    const classAttrs = content.matchAll(
      /\bclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g,
    );
    for (const m of classAttrs) {
      const value = m[1] ?? m[2] ?? m[3] ?? "";
      for (const cls of value.split(/\s+/)) {
        if (cls) used.add(cls);
      }
    }

    // classList.add('foo'), classList.add("foo")
    const dynamic = content.matchAll(
      /classList\.add\(\s*['"]([^'"]+)['"]\s*\)/g,
    );
    for (const m of dynamic) used.add(m[1]);
  }
  return used;
}

const cssContent = await Deno.readTextFile(CSS_FILE);
const cssClasses = extractCssClasses(cssContent);
const usedClasses = await extractUsedClasses(SITE_DIR);

// Marca como usadas las dinámicas conocidas
for (const c of KNOWN_DYNAMIC) usedClasses.add(c);

const allInCss = [...cssClasses.keys()].sort();
const orphans = allInCss.filter((c) => !usedClasses.has(c));
const used = allInCss.filter((c) => usedClasses.has(c));

console.log("───────────────────────────────────────────────────────────");
console.log("CSS audit");
console.log("───────────────────────────────────────────────────────────");
console.log(`CSS único en ${CSS_FILE}: ${cssClasses.size} clases`);
console.log(`HTML único en ${SITE_DIR}: ${usedClasses.size} clases en uso`);
console.log(`En CSS ∩ HTML: ${used.length} (${
  Math.round(100 * used.length / cssClasses.size)
}%)`);
console.log(
  `Huérfanas (en CSS sin uso detectable): ${orphans.length} (${
    Math.round(100 * orphans.length / cssClasses.size)
  }%)`,
);
console.log();

if (orphans.length === 0) {
  console.log("Sin huérfanas detectadas.");
  Deno.exit(0);
}

console.log("Candidatos a huérfanas (revisar antes de borrar):");
console.log();
for (const cls of orphans) {
  const lines = cssClasses.get(cls)!;
  const ref = lines.length > 3
    ? `${lines.slice(0, 3).join(",")},+${lines.length - 3}`
    : lines.join(",");
  console.log(`  .${cls.padEnd(40)} líneas ${ref}`);
}
