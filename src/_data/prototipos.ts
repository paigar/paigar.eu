// Descubrimiento automático de prototipos.
//
// Lee `src/_includes/prototipos/juegos/*.vto` y `.../herramientas/*.vto`,
// parsea el frontmatter YAML de cada uno, e inyecta el `kind` derivado del
// nombre de la subcarpeta. Añadir un prototipo nuevo = crear el archivo en
// la subcarpeta correcta con su frontmatter. Sin tocar este archivo.

import { parse as parseYaml } from "jsr:@std/yaml@^1";

export type Prototipo = {
  /** Identificador interno; coincide con el nombre del archivo: prototipos/{kind}s/{slug}.vto */
  slug: string;
  /** Determina sección y URL: /{kind}s/{slug}/. Se infiere de la subcarpeta. */
  kind: "juego" | "herramienta";
  /** Nombre visible (h1, card title) */
  name: string;
  /** Descripción breve para card e intro standalone */
  tagline: string;
  /** Imagen de portada para el card */
  cover: string;
  /** URL del post tutorial donde se explica este prototipo */
  articleUrl: string;
};

const baseDir = new URL("../_includes/prototipos/", import.meta.url);

// Mapa subcarpeta → kind. La subcarpeta es plural ("juegos"), el kind es singular.
const subfolderKinds: Record<string, "juego" | "herramienta"> = {
  juegos: "juego",
  herramientas: "herramienta",
};

const prototipos: Prototipo[] = [];

for (const [subfolder, kind] of Object.entries(subfolderKinds)) {
  const dir = new URL(`${subfolder}/`, baseDir);
  for (const entry of Deno.readDirSync(dir)) {
    if (!entry.isFile) continue;
    if (!entry.name.endsWith(".vto")) continue;

    const filePath = new URL(entry.name, dir);
    const content = Deno.readTextFileSync(filePath);
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    if (!match) {
      console.warn(
        `prototipos.ts: ${subfolder}/${entry.name} sin frontmatter, lo ignoro`,
      );
      continue;
    }
    const meta = parseYaml(match[1]) as Omit<Prototipo, "kind">;
    prototipos.push({ ...meta, kind });
  }
}

// Orden estable: juegos primero (por nombre), luego herramientas (por nombre).
prototipos.sort((a, b) => {
  if (a.kind !== b.kind) return a.kind === "juego" ? -1 : 1;
  return a.name.localeCompare(b.name, "es");
});

export default prototipos;
