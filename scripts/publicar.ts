// Build, push to GitHub, upload to Bunny Storage, and purge the Bunny CDN.
// Invoke with: deno task publicar

import "jsr:@std/dotenv@0.225/load";
import { walk } from "jsr:@std/fs@1/walk";
import { extname, relative } from "jsr:@std/path@1";

const SITE_DIR = "_site";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".pdf": "application/pdf",
};

function contentTypeFor(filePath: string): string {
  return MIME_TYPES[extname(filePath).toLowerCase()] ??
    "application/octet-stream";
}

// ─── helpers ────────────────────────────────────────────────────────────
async function run(cmd: string, ...args: string[]): Promise<void> {
  const p = new Deno.Command(cmd, {
    args,
    stdout: "inherit",
    stderr: "inherit",
  });
  const { success, code } = await p.output();
  if (!success) throw new Error(`${cmd} ${args.join(" ")} exited with ${code}`);
}

async function runCapture(cmd: string, ...args: string[]): Promise<string> {
  const p = new Deno.Command(cmd, { args, stdout: "piped", stderr: "piped" });
  const out = await p.output();
  if (!out.success) {
    throw new Error(new TextDecoder().decode(out.stderr).trim());
  }
  return new TextDecoder().decode(out.stdout).trim();
}

// ─── 1. Commit and push to GitHub ───────────────────────────────────────
async function gitPush(): Promise<void> {
  console.log("\n📦 Subiendo cambios a GitHub…");
  await run("git", "add", "-A");
  const status = await runCapture("git", "status", "--porcelain");
  if (status) {
    const mensaje = prompt("   Mensaje del commit:") ?? "";
    const message = mensaje.trim() || "actualización del sitio";
    await run("git", "commit", "-m", message);
  } else {
    console.log("   Sin cambios que commitear.");
  }
  await run("git", "push");
  console.log("   GitHub actualizado.");
}

// ─── 2. Build ───────────────────────────────────────────────────────────
async function build(): Promise<void> {
  console.log("\n🔨 Construyendo el sitio…");
  try {
    await Deno.remove(SITE_DIR, { recursive: true });
  } catch {
    // didn't exist; fine
  }
  await run("deno", "task", "build");
  console.log("   Build completado.");
}

// ─── 3. Upload to Bunny Storage ─────────────────────────────────────────
async function listarFicheros(
  dir: string,
): Promise<Array<{ localPath: string; remotePath: string }>> {
  const out: Array<{ localPath: string; remotePath: string }> = [];
  for await (const entry of walk(dir, { includeDirs: false })) {
    out.push({
      localPath: entry.path,
      remotePath: relative(dir, entry.path).replaceAll("\\", "/"),
    });
  }
  return out;
}

async function subirAPI(): Promise<void> {
  const hostname = Deno.env.get("BUNNY_STORAGE_HOSTNAME");
  const zone = Deno.env.get("BUNNY_STORAGE_ZONE_NAME");
  const password = Deno.env.get("BUNNY_STORAGE_PASSWORD");
  if (!hostname || !zone || !password) {
    throw new Error(
      "Faltan variables BUNNY_STORAGE_* en .env — revisa la configuración.",
    );
  }
  const baseUrl = `https://${hostname}/${zone}`;
  const ficheros = await listarFicheros(SITE_DIR);
  console.log(`\n🚀 Subiendo ${ficheros.length} ficheros a Bunny Storage…`);

  const encoder = new TextEncoder();
  let subidos = 0;
  for (const { localPath, remotePath } of ficheros) {
    const body = await Deno.readFile(localPath);
    const res = await fetch(`${baseUrl}/${remotePath}`, {
      method: "PUT",
      headers: {
        AccessKey: password,
        "Content-Type": contentTypeFor(localPath),
      },
      body,
    });
    if (!res.ok) {
      throw new Error(
        `Error subiendo ${remotePath}: ${res.status} ${res.statusText}`,
      );
    }
    subidos++;
    Deno.stdout.writeSync(
      encoder.encode(`\r   ${subidos}/${ficheros.length} ficheros subidos`),
    );
  }
  console.log("\n   Subida completada.");
}

// ─── 4. Purge the Bunny CDN pull zone cache ─────────────────────────────
async function purgarCache(): Promise<void> {
  console.log("\n🧹 Purgando caché de Bunny CDN…");
  const zoneId = Deno.env.get("BUNNY_PULL_ZONE_ID");
  const apiKey = Deno.env.get("BUNNY_API_KEY");
  if (!zoneId || !apiKey) {
    throw new Error("Faltan BUNNY_PULL_ZONE_ID o BUNNY_API_KEY en .env.");
  }
  const res = await fetch(
    `https://api.bunny.net/pullzone/${zoneId}/purgeCache`,
    {
      method: "POST",
      headers: { AccessKey: apiKey, "Content-Type": "application/json" },
    },
  );
  if (res.ok) {
    console.log("   Caché purgada.");
  } else {
    console.error(`   Error al purgar: ${res.status} ${res.statusText}`);
  }
}

// ─── Run ────────────────────────────────────────────────────────────────
try {
  await gitPush();
  await build();
  await subirAPI();
  await purgarCache();
  console.log("\n✅ Publicación completada.\n");
} catch (err) {
  console.error("\n❌ Error:", (err as Error).message);
  Deno.exit(1);
}
