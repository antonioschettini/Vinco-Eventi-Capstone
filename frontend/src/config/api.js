// Configurazione API centralizzata
// In sviluppo usa localhost, in produzione usa la variabile d'ambiente VITE_API_URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default API_BASE_URL;
