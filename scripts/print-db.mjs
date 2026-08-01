import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const res = await fetch("http://localhost:8080/api/gallery");
const items = await res.json();

// Stampa ogni item ordinato per displayOrder
const sorted = [...items].sort((a, b) => a.displayOrder - b.displayOrder);
sorted.forEach(item => {
  console.log(`id: "${item.id}" | displayOrder: ${item.displayOrder} | title: "${item.titleIta}" | src: "${item.src}"`);
});
