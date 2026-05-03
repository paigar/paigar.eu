import lume from "lume/mod.ts";
import date from "lume/plugins/date.ts";
import slugify_urls from "lume/plugins/slugify_urls.ts";
import feed from "lume/plugins/feed.ts";
import sitemap from "lume/plugins/sitemap.ts";
import code_highlight from "lume/plugins/code_highlight.ts";
import { es } from "npm:date-fns/locale/es";
import { parse as parseYaml } from "jsr:@std/yaml@^1";
import slug from "./src/_data/slug.ts";
import { generateLQIP } from "./scripts/lqip.ts";

// ─── Site metadata + CDN base ─────────────────────────────────────────
const dataYaml = parseYaml(
  await Deno.readTextFile("./src/_data.yml"),
) as { site: { cdn: string; [k: string]: unknown } };
const CDN: string = dataYaml.site.cdn;

// LQIP cache: se carga al arrancar y se refresca antes de cada build.
// Antes del primer build no existe; lo capturamos sin reventar.
let lqipData: Record<string, string> = {};
try {
  lqipData = JSON.parse(await Deno.readTextFile("./src/_data/lqip.json"));
} catch {
  // primera vez, no hay cache aún
}

// ─── Responsive image helpers ─────────────────────────────────────────
// Mismo conjunto de presets que Idenautas. La aspect ratio condiciona
// width/height del <img> (anti-CLS), las widths definen el srcset, y
// sizes guía al navegador para elegir la variante correcta.
const IMG_PRESETS = {
  hero: { widths: [480, 1200, 1920], sizes: "100vw", aspect: "16/9" },
  content: {
    widths: [480, 800, 1200],
    sizes: "(max-width: 768px) 100vw, 50vw",
    aspect: "3/2",
  },
  mosaic: {
    widths: [480, 800],
    sizes: "(max-width: 768px) 100vw, 33vw",
    aspect: "3/2",
  },
  visual: {
    widths: [480, 800],
    sizes: "(max-width: 768px) 100vw, 80vw",
    aspect: "3/2",
  },
  thumb: {
    widths: [480, 800],
    sizes: "(max-width: 768px) 100vw, 40vw",
    aspect: "16/9",
  },
} as const;

type Preset = keyof typeof IMG_PRESETS;

function imgBase(imgPath: string): string {
  const i = imgPath.lastIndexOf(".");
  return i >= 0 ? imgPath.slice(0, i) : imgPath;
}

function imgUrl(imgPath: string, size: number, fmt: string): string {
  return `${CDN}${imgBase(imgPath)}-${size}.${fmt}`;
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ─── Lume site ────────────────────────────────────────────────────────
const site = lume({
  src: "./src",
  location: new URL("https://paigar.eu"),
  server: {
    port: 3000,
  },
});

// Regenera la cache de LQIP antes de cada build. Solo las imágenes que
// no estén ya en cache hacen un round-trip HTTP a la CDN, así que las
// builds sucesivas se mantienen rápidas.
site.addEventListener("beforeBuild", async () => {
  lqipData = await generateLQIP({ quiet: true });
});

site.copy("static", ".");
site.copy("styles");

site.use(date({ locales: { es } }));
site.use(slugify_urls({
  lowercase: true,
  alphanumeric: true,
  separator: "-",
  replace: {
    "ñ": "n",
    "Ñ": "N",
  },
}));
site.use(code_highlight());
site.use(sitemap());

// Habilita Vento sobre el cuerpo de los markdown para que los posts
// puedan llamar a los helpers globales ({{ img(...) }}, {{ imgUrl(...) }}).
// Los posts que muestran sintaxis Vento en bloques de código pueden
// optar fuera con `templateEngine: md` en su frontmatter.
site.preprocess([".md"], (pages) => {
  for (const page of pages) {
    // deno-lint-ignore no-explicit-any
    const fm = page.data as any;
    if (fm.templateEngine === undefined) {
      fm.templateEngine = ["vto", "md"];
    }
  }
});

site.filter("slug", slug);

// ─── Helpers de imagen como filtros y datos globales ───────────────────
// Los datos globales hacen que en Vento puedas llamar:
//   {{ imgUrl("foo.png", 1200, "jpg") }}
//   {{ img("foo.png", "alt", "hero", "eager") |> safe }}
//   {{ cardPicture("foo.png", "alt", true, false) |> safe }}
site.filter("lqip", (imgPath: string) => lqipData[imgPath] || "");
site.filter(
  "imgUrl",
  (imgPath: string, size: number, fmt = "jpg") => imgUrl(imgPath, size, fmt),
);
site.data(
  "imgUrl",
  (imgPath: string, size: number, fmt = "jpg") => imgUrl(imgPath, size, fmt),
);

site.data(
  "img",
  function img(
    imgPath: string,
    alt = "",
    preset: Preset = "content",
    loading: "lazy" | "eager" = "lazy",
  ): string {
    const safeAlt = escapeAttr(alt);
    const cfg = IMG_PRESETS[preset] ?? IMG_PRESETS.content;
    const widths = cfg.widths;
    const largest = widths[widths.length - 1];
    const srcsetFor = (fmt: string) =>
      widths.map((w) => `${imgUrl(imgPath, w, fmt)} ${w}w`).join(", ");
    const priority = loading === "eager" ? ' fetchpriority="high"' : "";
    const [aw, ah] = cfg.aspect.split("/").map(Number);
    const width = largest;
    const height = Math.round((largest * ah) / aw);
    const lqip = lqipData[imgPath] || imgUrl(imgPath, 16, "jpg");
    return `<div class="lqip-wrap" style="background-image:url('${lqip}')"><picture><source type="image/avif" srcset="${
      srcsetFor("avif")
    }" sizes="${cfg.sizes}"><source type="image/webp" srcset="${
      srcsetFor("webp")
    }" sizes="${cfg.sizes}"><img src="${
      imgUrl(imgPath, largest, "jpg")
    }" srcset="${
      srcsetFor("jpg")
    }" sizes="${cfg.sizes}" alt="${safeAlt}" loading="${loading}" width="${width}" height="${height}"${priority} onload="this.closest('.lqip-wrap').classList.add('loaded')"></picture></div>`;
  },
);

site.data(
  "cardPicture",
  function cardPicture(
    imgPath: string,
    alt = "",
    wide = false,
    eager = false,
  ): string {
    const safeAlt = escapeAttr(alt);
    const widths = wide ? [480, 800] : [480];
    const largest = widths[widths.length - 1];
    const width = largest;
    const height = Math.round((largest * 9) / 16);
    const loading = eager ? "eager" : "lazy";
    const srcsetFor = (fmt: string) =>
      widths.map((w) => `${imgUrl(imgPath, w, fmt)} ${w}w`).join(", ");
    const lqip = lqipData[imgPath] || imgUrl(imgPath, 16, "jpg");

    if (widths.length === 1) {
      return `<div class="lqip-wrap" style="background-image:url('${lqip}')"><picture><source type="image/avif" srcset="${
        imgUrl(imgPath, largest, "avif")
      }"><source type="image/webp" srcset="${
        imgUrl(imgPath, largest, "webp")
      }"><img src="${
        imgUrl(imgPath, largest, "jpg")
      }" alt="${safeAlt}" loading="${loading}" width="${width}" height="${height}" onload="this.closest('.lqip-wrap').classList.add('loaded')"></picture></div>`;
    }

    return `<div class="lqip-wrap" style="background-image:url('${lqip}')"><picture><source type="image/avif" srcset="${
      srcsetFor("avif")
    }" sizes="(max-width: 768px) 100vw, 50vw"><source type="image/webp" srcset="${
      srcsetFor("webp")
    }" sizes="(max-width: 768px) 100vw, 50vw"><img src="${
      imgUrl(imgPath, largest, "jpg")
    }" srcset="${
      srcsetFor("jpg")
    }" sizes="(max-width: 768px) 100vw, 50vw" alt="${safeAlt}" loading="${loading}" width="${width}" height="${height}" onload="this.closest('.lqip-wrap').classList.add('loaded')"></picture></div>`;
  },
);

site.use(feed({
  output: ["/feed.xml", "/feed.json"],
  query: "type=post",
  sort: "date=desc",
  limit: 20,
  info: {
    title: "PAIGAR",
    description:
      "Portal de Apuntes, Ideas, Garabatos, Artilugios y Retrofuturismo",
    lang: "es",
  },
  items: {
    title: "=title",
    description: "=excerpt",
    image: "=image",
    lang: "es",
  },
}));

export default site;
