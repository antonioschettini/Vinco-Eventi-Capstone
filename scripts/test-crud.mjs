// Test CRUD completo galleria
import fetch from "node-fetch";

const BASE = "http://localhost:8080";
const EMAIL = "vincoeventi@gmail.com";
const PWD = "RipBigVincoEventi!";

// 1. Login
const loginRes = await fetch(`${BASE}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: EMAIL, password: PWD }),
});
const loginData = await loginRes.json();
const token = loginData.token || loginData.accessToken || loginData.jwt;
console.log("1. LOGIN:", loginRes.status === 200 ? "✅ OK" : "❌ FAIL", `(${loginRes.status})`);

// 2. GET all gallery items (public)
const getAllRes = await fetch(`${BASE}/api/gallery`);
const items = await getAllRes.json();
const cloudItems = items.filter(i => i.src.startsWith("http"));
const featured = items.filter(i => i.featured);
console.log("2. GET ALL:", getAllRes.status === 200 ? "✅ OK" : "❌ FAIL");
console.log(`   Totale: ${items.length}, Cloudinary: ${cloudItems.length}, Featured: ${featured.length}`);

// 3. GET singolo item (public)
const firstId = items[0]?.id;
const getOneRes = await fetch(`${BASE}/api/gallery/${firstId}`);
const oneItem = await getOneRes.json();
console.log("3. GET ONE:", getOneRes.status === 200 ? "✅ OK" : "❌ FAIL");
console.log(`   ID: ${oneItem.id?.substring(0, 8)}... | Src Cloudinary: ${oneItem.src?.startsWith("http") ? "✅" : "❌"}`);

// 4. POST - Crea elemento di test
const createRes = await fetch(`${BASE}/api/admin/gallery`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    titleIta: "TEST ITEM - DA ELIMINARE",
    titleEng: "TEST ITEM - TO DELETE",
    subtitleIta: "Item di test per verifica CRUD",
    subtitleEng: "Test item for CRUD verification",
    type: "image",
    src: "https://res.cloudinary.com/y9rfpsut/image/upload/v1785571186/vinco_eventi_galleria/bkimedchkfe02pqhm5xi.jpg",
    category: "djset",
    featured: false,
    startTime: null,
    displayOrder: 99,
  }),
});
const created = await createRes.json();
console.log("4. POST (CREATE):", createRes.status === 201 ? "✅ OK" : "❌ FAIL", `(${createRes.status})`);
console.log(`   Nuovo ID: ${created.id?.substring(0, 8)}...`);

// 5. PUT - Aggiorna l'elemento di test
const updateRes = await fetch(`${BASE}/api/admin/gallery/${created.id}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    titleIta: "TEST ITEM - AGGIORNATO",
    titleEng: "TEST ITEM - UPDATED",
    subtitleIta: "Item aggiornato con successo",
    subtitleEng: "Successfully updated item",
    type: "image",
    src: "https://res.cloudinary.com/y9rfpsut/image/upload/v1785571186/vinco_eventi_galleria/bkimedchkfe02pqhm5xi.jpg",
    category: "djset",
    featured: false,
    startTime: null,
    displayOrder: 99,
  }),
});
const updated = await updateRes.json();
console.log("5. PUT (UPDATE):", updateRes.status === 200 ? "✅ OK" : "❌ FAIL", `(${updateRes.status})`);
console.log(`   Titolo aggiornato: "${updated.titleIta}"`);

// 6. DELETE - Elimina l'elemento di test
const deleteRes = await fetch(`${BASE}/api/admin/gallery/${created.id}`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${token}` },
});
console.log("6. DELETE:", deleteRes.status === 204 ? "✅ OK" : "❌ FAIL", `(${deleteRes.status})`);

// 7. Verifica finale - count items (dovrebbe tornare a 31)
const finalRes = await fetch(`${BASE}/api/gallery`);
const finalItems = await finalRes.json();
console.log("7. GET FINALE:", finalRes.status === 200 ? "✅ OK" : "❌ FAIL");
console.log(`   Item totali dopo delete: ${finalItems.length} (atteso: ${items.length})`);

console.log("\n============================");
console.log("  TUTTI I TEST CRUD: " + ([loginRes.status === 200, getAllRes.status === 200, getOneRes.status === 200, createRes.status === 201, updateRes.status === 200, deleteRes.status === 204, finalRes.status === 200].every(Boolean) ? "✅ PASS" : "❌ SOME FAILED"));
console.log("============================");
