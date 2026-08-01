// wait-and-upload.mjs — attende che il backend sia pronto poi lancia il batch
import { spawn } from "child_process";
import http from "http";

const BACKEND_URL = "http://localhost:8080/api/gallery";
const MAX_ATTEMPTS = 20;
const WAIT_MS = 3000;

async function checkBackend() {
  return new Promise((resolve) => {
    const req = http.get(BACKEND_URL, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
  });
}

async function waitForBackend() {
  console.log("Attesa avvio backend Spring Boot...");
  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    const ok = await checkBackend();
    if (ok) {
      console.log(`Backend pronto dopo ${i} tentativi!`);
      return true;
    }
    console.log(`  Tentativo ${i}/${MAX_ATTEMPTS}... (attesa ${WAIT_MS}ms)`);
    await new Promise(r => setTimeout(r, WAIT_MS));
  }
  return false;
}

async function main() {
  const ready = await waitForBackend();
  if (!ready) {
    console.error("Backend non raggiungibile dopo tutti i tentativi. Riavvialo manualmente.");
    process.exit(1);
  }

  console.log("\nLancio upload-gallery-to-cloudinary...\n");
  const child = spawn("node", ["scripts/upload-gallery-to-cloudinary.mjs"], {
    stdio: "inherit",
    shell: false,
  });
  child.on("exit", (code) => process.exit(code));
}

main();
