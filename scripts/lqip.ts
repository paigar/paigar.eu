// Generates Low-Quality Image Placeholder (LQIP) base64 data URIs.
//
// Recorre src/ buscando .md, .vto, .page.ts, .yml, extrae cada slug de
// imagen referenciado por `{{ img(...) }}`, `{{ cardPicture(...) }}` y
// el campo `image:` del frontmatter. Para cada slug descarga un JPG de
// 16px desde la CDN y lo cachea en src/_data/lqip.json como base64.
// Las entradas que ya no se referencian se purgan; las nuevas se añaden.
//
// Uso:
//   - CLI:    deno task lqip
//   - módulo: import { generateLQIP } from "./scripts/lqip.ts"

import { walk } from "jsr:@std/fs@^1/walk";
import { encodeBase64 } from "jsr:@std/encoding@^1/base64";
import { parse as parseYaml } from "jsr:@std/yaml@^1";

const SRC_DIR = "./src";
const OUTPUT = "./src/_data/lqip.json";
const SITE_DATA = "./src/_data.yml";

function imgBase(imgPath: string): string {
  const i = imgPath.lastIndexOf(".");
  return i >= 0 ? imgPath.slice(0, i) : imgPath;
}

// Captura el primer argumento de {{ img("foo.png", ...) }} o {{ cardPicture("foo.png", ...) }}
const SHORTCODE_RE =
  /\{\{[-\s]*(?:img|cardPicture)\s*\(\s*["']([^"']+)["']/g;
// Frontmatter:  image: foo.png   o   image: "foo.png"
const FRONTMATTER_IMG_RE = /^image:\s*["']?([^"'\n]+?)["']?\s*$/m;
// Saltamos los SVG (se sirven en local) y cualquier path absoluto que
// empiece por `/` (placeholder local intencional o asset que no vive en CDN).
const SKIP_RE = /^\/|\.svg$/i;

async function findImagePaths(): Promise<string[]> {
  const paths = new Set<string>();
  for await (
    const entry of walk(SRC_DIR, {
      exts: [".md", ".vto", ".ts", ".yml"],
      skip: [/node_modules/, /_data\/lqip\.json$/],
    })
  ) {
    if (!entry.isFile) continue;
    const content = await Deno.readTextFile(entry.path);
    let m: RegExpExecArray | null;
    SHORTCODE_RE.lastIndex = 0;
    while ((m = SHORTCODE_RE.exec(content)) !== null) {
      if (!SKIP_RE.test(m[1])) paths.add(m[1]);
    }
    const fm = content.match(FRONTMATTER_IMG_RE);
    if (fm) {
      const p = fm[1].trim();
      if (p && !SKIP_RE.test(p)) paths.add(p);
    }
  }
  return [...paths];
}

async function fetchBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get("content-type") ?? "image/jpeg";
  const bytes = new Uint8Array(await res.arrayBuffer());
  return `data:${type};base64,${encodeBase64(bytes)}`;
}

interface Site {
  cdn: string;
}

export async function generateLQIP(
  opts: { quiet?: boolean } = {},
): Promise<Record<string, string>> {
  const { quiet = false } = opts;

  const data = parseYaml(await Deno.readTextFile(SITE_DATA)) as {
    site: Site;
  };
  const cdn = data.site.cdn;

  let cache: Record<string, string> = {};
  try {
    cache = JSON.parse(await Deno.readTextFile(OUTPUT));
  } catch {
    // primera ejecución, no hay cache
  }

  const paths = await findImagePaths();
  const referenced = new Set(paths);

  // Purga entradas obsoletas
  for (const key of Object.keys(cache)) {
    if (!referenced.has(key)) {
      if (!quiet) console.log(`LQIP purge: ${key}`);
      delete cache[key];
    }
  }

  // Descarga las nuevas
  let added = 0;
  let failed = 0;
  for (const p of paths) {
    if (cache[p]) continue;
    const url = `${cdn}${imgBase(p)}-16.jpg`;
    try {
      cache[p] = await fetchBase64(url);
      added++;
      if (!quiet) console.log(`LQIP add: ${p}`);
    } catch (e) {
      failed++;
      if (!quiet) {
        console.warn(`LQIP miss: ${p} (${url}): ${(e as Error).message}`);
      }
    }
  }

  await Deno.writeTextFile(OUTPUT, JSON.stringify(cache, null, 2));
  if (!quiet) {
    console.log(
      `LQIP cache: ${
        Object.keys(cache).length
      } entries (${added} added, ${failed} failed)`,
    );
  }
  return cache;
}

if (import.meta.main) {
  await generateLQIP({ quiet: false });
}
