import API_BASE_URL from "../config/api";

/**
 * Utility per la generazione dei link di salvataggio evento nei vari calendari (Google, Apple, Outlook)
 * garantendo la massima compatibilità cross-platform (iOS, macOS, Android, Windows).
 */

const formatToYmd = (dateStr) => {
  if (!dateStr) return "";
  // dateStr può essere ISO "YYYY-MM-DD" o già parsata
  const clean = dateStr.replace(/[^\d]/g, "");
  if (clean.length >= 8) {
    return clean.substring(0, 8);
  }
  return "";
};

const getNextDayYmd = (dateStr) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}${m}${day}`;
  }
  return formatToYmd(dateStr);
};

const escapeIcsText = (str) => {
  if (!str) return "";
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n/g, " ")
    .replace(/\n/g, " ")
    .replace(/\r/g, " ");
};

/**
 * Genera l'URL diretto per la creazione evento su Google Calendar.
 */
export const generateGoogleCalendarUrl = (quote) => {
  if (!quote || !quote.dataEvento) return "";
  const startYmd = formatToYmd(quote.dataEvento);
  const endYmd = getNextDayYmd(quote.dataEvento);

  const title = encodeURIComponent(`Evento VINCO EVENTI - ${quote.nome} ${quote.cognome}`);
  const details = encodeURIComponent(
    `Cliente: ${quote.nome} ${quote.cognome}\n` +
      `Tipo Evento: ${quote.tipoEvento || "Non specificato"}\n` +
      `Email: ${quote.email || "N/D"}\n` +
      `Telefono: ${quote.telefono || "N/D"}\n` +
      `Ospiti: ${quote.numeroOspiti || "N/D"}\n` +
      `Fascia Oraria: ${quote.orarioGiornata || "N/D"}\n` +
      (quote.messaggio ? `Messaggio: ${quote.messaggio}` : "")
  );
  const location = encodeURIComponent(quote.location || "");

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startYmd}/${endYmd}&details=${details}&location=${location}`;
};

/**
 * Genera l'URL diretto per la creazione evento su Outlook Web.
 */
export const generateOutlookCalendarUrl = (quote) => {
  if (!quote || !quote.dataEvento) return "";
  const startIso = `${quote.dataEvento}T00:00:00`;
  const endIso = `${quote.dataEvento}T23:59:59`;

  const subject = encodeURIComponent(`Evento VINCO EVENTI - ${quote.nome} ${quote.cognome}`);
  const body = encodeURIComponent(
    `Cliente: ${quote.nome} ${quote.cognome}\n` +
      `Tipo Evento: ${quote.tipoEvento || "Non specificato"}\n` +
      `Email: ${quote.email || "N/D"}\n` +
      `Telefono: ${quote.telefono || "N/D"}\n` +
      (quote.messaggio ? `Messaggio: ${quote.messaggio}` : "")
  );
  const location = encodeURIComponent(quote.location || "");

  return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${subject}&startdt=${startIso}&enddt=${endIso}&allday=true&body=${body}&location=${location}`;
};

/**
 * Genera la stringa iCalendar (.ics) conforme a RFC 5545.
 */
export const generateIcsContent = (quote) => {
  if (!quote || !quote.dataEvento) return "";
  const startYmd = formatToYmd(quote.dataEvento);
  const endYmd = getNextDayYmd(quote.dataEvento);
  const nowUtc = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const uid = quote.id ? `quote-${quote.id}@vincoeventi.it` : `quote-${Date.now()}@vincoeventi.it`;

  const descriptionStr =
    `Cliente: ${quote.nome} ${quote.cognome}\\n` +
    `Tipo Evento: ${quote.tipoEvento || "Non specificato"}\\n` +
    `Email: ${quote.email || "N/D"}\\n` +
    `Telefono: ${quote.telefono || "N/D"}\\n` +
    `Ospiti: ${quote.numeroOspiti || "N/D"}\\n` +
    (quote.messaggio ? `Messaggio: ${escapeIcsText(quote.messaggio)}` : "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//VINCO EVENTI//Gestione Preventivi//IT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART;VALUE=DATE:${startYmd}`,
    `DTEND;VALUE=DATE:${endYmd}`,
    `SUMMARY:Evento VINCO EVENTI - ${escapeIcsText(quote.nome + " " + quote.cognome)}`,
    `DESCRIPTION:${descriptionStr}`,
    quote.location ? `LOCATION:${escapeIcsText(quote.location)}` : "",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
};

/**
 * Scarica direttamente il file .ics per Apple Calendar / iCal / Outlook Desktop.
 */
export const downloadIcsFile = (quote) => {
  const icsText = generateIcsContent(quote);
  if (!icsText) return;

  const blob = new Blob([icsText], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const fileName = `evento-vinco-${(quote.nome || "cliente").toLowerCase()}-${formatToYmd(quote.dataEvento)}.ics`;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Salva l'evento nel Calendario Apple (macOS / iOS) ed altri calendari di sistema tramite file .ics.
 * Evita l'errore di protocollo webcal:// (che aprirebbe la modalità "Aggiungi calendario con iscrizione").
 * Genera e scarica/apre la scheda dell'evento singolo conforme RFC 5545.
 */
export const openAppleCalendar = (quote) => {
  if (!quote || !quote.dataEvento) return;

  if (quote.id) {
    // Utilizzando l'endpoint backend con Content-Disposition: inline,
    // Chrome, Safari e Firefox su Mac e iOS aprono direttamente la scheda evento di Calendario Apple
    // senza forzare il download manuale nella cartella dei download.
    const baseUrl = API_BASE_URL || "http://localhost:8080";
    const icsUrl = `${baseUrl}/api/quotes/${quote.id}/calendar.ics`;
    window.location.href = icsUrl;
  } else {
    // Fallback locale per la generazione istantanea del file .ics via Blob
    downloadIcsFile(quote);
  }
};

