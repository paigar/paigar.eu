// Build, push to GitHub, and upload to statichost.eu via direct upload API.
// Invoke with: deno task publicar

import "jsr:@std/dotenv@0.225/load";

const SITE_DIR = "_site";
const SITE_NAME = "paigar";
const BUILDER_HOST = Deno.env.get("STATICHOST_BUILDER") ?? "https://builder.statichost.eu";

// ─── helpers ────────────────────────────────────────────────────────────────
async function run(cmd: string, ...args: string[]): Promise<void> {
  const p = new Deno.Command(cmd, { args, stdout: "inherit", stderr: "inherit" });
  const { success, code } = await p.output();
  if (!success) throw new Error(`${cmd} ${args.join(" ")} exited with ${code}`);
}

async function runCapture(cmd: string, ...args: string[]): Promise<string> {
  const p = new Deno.Command(cmd, { args, stdout: "piped", stderr: "piped" });
  const out = await p.output();
  if (!out.success) throw new Error(new TextDecoder().decode(out.stderr).trim());
  return new TextDecoder().decode(out.stdout).trim();
}

// ─── 1. Commit and push to GitHub ───────────────────────────────────────────
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

// ─── 2. Build ────────────────────────────────────────────────────────────────
async function build(): Promise<void> {
  console.log("\n🔨 Construyendo el sitio…");
  try { await Deno.remove(SITE_DIR, { recursive: true }); } catch { /* fine */ }
  await run("deno", "task", "build");
  console.log("   Build completado.");
}

// ─── 3. Zip and upload to statichost.eu ─────────────────────────────────────
async function upload(): Promise<void> {
  const apiKey = Deno.env.get("STATICHOST_APIKEY");
  if (!apiKey) throw new Error("Falta STATICHOST_APIKEY en .env");

  const zipPath = `${Deno.cwd()}\\statichost.zip`;

  console.log("\n🗜️  Creando zip del sitio…");
  try { await Deno.remove(zipPath); } catch { /* fine */ }
  await run(
    "powershell", "-Command",
    `Push-Location "${SITE_DIR}"; Compress-Archive -Path ".\\*" -DestinationPath "${zipPath}" -Force; Pop-Location`,
  );

  console.log(`\n🚀 Subiendo a ${BUILDER_HOST}/${SITE_NAME}/drop…`);
  const zip = await Deno.readFile(zipPath);
  const res = await fetch(`${BUILDER_HOST}/${SITE_NAME}/drop`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/zip",
      "Accept": "text/plain",
    },
    body: zip,
  });

  try { await Deno.remove(zipPath); } catch { /* fine */ }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Error en la subida: ${res.status} ${res.statusText}\n${body}`);
  }

  const msg = await res.text();
  if (msg.trim()) console.log("  ", msg.trim());
  console.log("   Subida completada.");
}

// ─── Run ─────────────────────────────────────────────────────────────────────
try {
  await gitPush();
  await build();
  await upload();
  console.log("\n✅ Publicación completada.\n");
} catch (err) {
  console.error("\n❌ Error:", (err as Error).message);
  Deno.exit(1);
}
