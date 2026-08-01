/**
 * apiClient – Client HTTP centralizzato per Vinco Eventi
 *
 * Gestisce automaticamente:
 * - Parsing del body JSON dell'ErrorPayload restituito dal GlobalExceptionHandler Spring
 * - Lancia ApiError con message dal backend e statusCode HTTP
 * - Supporta header Authorization con JWT
 * - Compatibile con authFetch per il logout automatico su 401
 */

import { logout } from "../redux/slices/authSlice";

/**
 * Errore tipizzato con messaggio backend e status HTTP.
 */
export class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

/**
 * Parsifica la response: se non ok, tenta di leggere il campo `message`
 * dall'ErrorPayload del backend e lancia ApiError.
 *
 * @param {Response} response
 * @returns {Promise<any>} - Dati JSON se ok
 * @throws {ApiError}
 */
async function parseResponse(response) {
  if (response.ok) {
    // 204 No Content → nessun corpo da parsificare
    if (response.status === 204) return null;
    return response.json();
  }

  // Tenta di leggere l'ErrorPayload dal backend Spring
  let message = `Errore ${response.status}: ${response.statusText || "Errore sconosciuto"}`;
  try {
    const errBody = await response.json();
    // GlobalExceptionHandler restituisce { message, timestamp }
    if (errBody?.message) {
      message = errBody.message;
    }
  } catch {
    // Il body non è JSON (es. HTML da errori Tomcat) — usa il fallback
  }

  throw new ApiError(message, response.status);
}

/**
 * Fetch base con gestione errori centralizzata.
 *
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<any>}
 * @throws {ApiError}
 */
export async function apiFetch(url, options = {}) {
  try {
    const response = await fetch(url, options);
    return await parseResponse(response);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // Errore di rete (offline, DNS, CORS pre-flight fallito, ecc.)
    throw new ApiError(
      "Impossibile connettersi al server. Controlla la connessione e riprova.",
      0
    );
  }
}

/**
 * Fetch autenticata: inietta JWT e gestisce auto-logout su 401.
 *
 * @param {string} url
 * @param {RequestInit} options
 * @param {string} token - JWT dall'authSlice
 * @param {Function} dispatch - Redux dispatch
 * @returns {Promise<any>}
 * @throws {ApiError}
 */
export async function authApiFetch(url, options = {}, token, dispatch) {
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  try {
    const response = await fetch(url, { ...options, headers });

    // Auto-logout su JWT scaduto / non valido
    if (response.status === 401 && dispatch) {
      dispatch(logout());
    }

    return await parseResponse(response);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      "Impossibile connettersi al server. Controlla la connessione e riprova.",
      0
    );
  }
}
