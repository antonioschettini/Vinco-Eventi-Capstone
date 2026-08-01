/**
 * authFetch – Wrapper di fetch autenticato con auto-logout in caso di 401
 *
 * Risolve il bug latente per cui un JWT scaduto (dopo 1h) lascia l'utente
 * bloccato nell'area admin con tutte le API che falliscono silenziosamente.
 * Ora, qualsiasi risposta 401 dall'API admin provoca il logout automatico
 * e il redirect alla pagina di login admin.
 *
 * Utilizzo:
 *   import { authFetch } from "../utils/authFetch";
 *   const response = await authFetch(url, options, token, dispatch);
 */

import { logout } from "../redux/slices/authSlice";

/**
 * @param {string} url - URL dell'endpoint
 * @param {RequestInit} options - Opzioni fetch (method, body, headers aggiuntivi)
 * @param {string} token - JWT token dall'authSlice
 * @param {Function} dispatch - Redux dispatch per triggherare logout
 * @returns {Promise<Response>}
 */
export async function authFetch(url, options = {}, token, dispatch) {
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Se il token è scaduto o non valido, logout automatico
  if (response.status === 401) {
    if (dispatch) {
      dispatch(logout());
    }
    // Non ri-lanciare qui: il chiamante riceverà la response con status 401
    // e il redirect avverrà grazie al ProtectedRoute che verificherà !isAuthenticated
  }

  return response;
}
