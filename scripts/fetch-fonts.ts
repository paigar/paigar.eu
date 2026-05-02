// scripts/fetch-fonts.ts
//
// Descarga las fuentes de Google Fonts y genera src/styles/fonts.css con
// las @font-face apuntando a archivos locales en /fonts/.
//
// Uso:   deno task fonts
// Re-ejecutable: sobreescribe los .woff2 y regenera el CSS.
//
// Para cambiar fuentes / pesos / ejes, edita FONT_URL más abajo: copia la
// URL de embed que da Google Fonts (la de css2?...) y pégala aquí entera.

const FONT_URL =
	"https://fonts.googleapis.com/css2" +
	"?family=Major+Mono+Display" +
	"&family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700" +
	"&family=DM+Mono:wght@400;500" +
	"&display=swap";

// Solo nos interesa el rango latino para una bitácora en español.
const ALLOWED_SUBSETS = new Set(["latin", "latin-ext"]);

// User-Agent moderno para que Google sirva woff2 (la versión más comprimida).
const UA =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
	"(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const projectRoot = new URL("../", import.meta.url);
const fontsDir = new URL("src/static/fonts/", projectRoot);
const cssPath = new URL("src/styles/fonts.css", projectRoot);

await Deno.mkdir(fontsDir, { recursive: true });

console.log("→ fetching", FONT_URL);
const css = await fetch(FONT_URL, { headers: { "User-Agent": UA } }).then((r) =>
	r.text()
);

// Cada @font-face en la respuesta de Google viene precedido por un comentario
// con el nombre del subset, p. ej.:  /* latin */  @font-face { ... }
const blocks = css.match(/\/\*\s*[^*]+\s*\*\/\s*@font-face\s*\{[^}]*\}/g) ?? [];
console.log(`→ ${blocks.length} @font-face blocks found`);

const slugify = (s: string) =>
	s
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/\s+/g, "-");

let localCss = "/* ===========================================================\n";
localCss += "   Fuentes self-hosted (descargadas de Google Fonts).\n";
localCss += "   Generado por scripts/fetch-fonts.ts — no editar a mano.\n";
localCss += "   =========================================================== */\n\n";

let downloaded = 0;
let skipped = 0;

for (const block of blocks) {
	const subsetMatch = block.match(/^\/\*\s*([^*]+?)\s*\*\//);
	const subset = subsetMatch?.[1].trim() ?? "default";
	if (!ALLOWED_SUBSETS.has(subset)) {
		skipped++;
		continue;
	}

	const familyMatch = block.match(/font-family:\s*'([^']+)'/);
	const styleMatch = block.match(/font-style:\s*([^;]+);/);
	const weightMatch = block.match(/font-weight:\s*([^;]+);/);
	const urlMatch = block.match(/url\(([^)]+)\)/);

	if (!familyMatch || !urlMatch) {
		skipped++;
		continue;
	}

	const family = familyMatch[1];
	const style = (styleMatch?.[1] ?? "normal").trim();
	const weight = (weightMatch?.[1] ?? "400").trim().replace(/\s+/g, "_");
	const url = urlMatch[1];

	const familySlug = slugify(family);
	const filename =
		`${familySlug}-${style}-${weight}-${subset}.woff2`.replace(/_/g, "-");

	console.log(`  ↓ ${filename}`);
	const data = new Uint8Array(await fetch(url).then((r) => r.arrayBuffer()));
	await Deno.writeFile(new URL(filename, fontsDir), data);
	downloaded++;

	// Reescribimos el @font-face apuntando al archivo local.
	const localBlock = block
		.replace(/^\/\*[^*]*\*\/\s*/, "") // quitamos el comentario del subset
		.replace(/url\([^)]+\)/, `url("/fonts/${filename}")`);

	localCss += `/* ${family} — style:${style} weight:${weight} subset:${subset} */\n`;
	localCss += localBlock + "\n\n";
}

await Deno.writeTextFile(cssPath, localCss);

console.log(
	`→ done. ${downloaded} fonts downloaded, ${skipped} skipped (other subsets).`,
);
console.log(`→ wrote ${cssPath.pathname}`);
