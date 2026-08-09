package antonioschettini.backend.services;

import antonioschettini.backend.entities.QuoteRequest;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Map;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private TranslationService translationService;

    @Autowired
    @Lazy
    private QuoteService quoteService;

    @Value("${app.backend-base-url:http://localhost:8080}")
    private String backendBaseUrl;

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Value("${mail.from:vincoeventi@gmail.com}")
    private String mailFrom;

    @Value("${brevo.api-key:}")
    private String brevoApiKey;


    private static final String URL_LOGO_VINCO = "https://res.cloudinary.com/oe1bztwb/image/upload/v1786263577/vinco_email_assets/g8xo3jtogac3rdr5kgfw.png";
    private static final String URL_GOOGLE_ICON = "https://res.cloudinary.com/oe1bztwb/image/upload/v1786265382/vinco_email_assets/google-official-v2.svg";
    private static final String URL_APPLE_ICON = "https://res.cloudinary.com/oe1bztwb/image/upload/v1786265381/vinco_email_assets/apple-official-v2.svg";
    private static final String URL_DASHBOARD_ICON = "https://res.cloudinary.com/oe1bztwb/image/upload/v1786263579/vinco_email_assets/rv8jkbcolykkaccvceie.png";
    private static final String URL_INSTAGRAM_ICON = "https://res.cloudinary.com/oe1bztwb/image/upload/v1786263579/vinco_email_assets/ppypfvmhxsgmynx4a8wl.png";
    private static final String URL_PHONE_ICON = "https://res.cloudinary.com/oe1bztwb/image/upload/v1786263580/vinco_email_assets/lkhurx9vaflldpam4hix.png";
    private static final String URL_WHATSAPP_ICON = "https://res.cloudinary.com/oe1bztwb/image/upload/v1786263580/vinco_email_assets/eh1so4civt5pvomslk5b.png";

    @Async
    public void sendQuoteNotificationEmail(QuoteRequest quote) {
        if (quote == null) {
            return;
        }

        if (mailSender == null && (brevoApiKey == null || brevoApiKey.isBlank())) {
            System.out.println("[WARN EmailService] Né JavaMailSender né Brevo API Key configurati. Salto l'invio email admin.");
            return;
        }

        try {
            String subject = "Richiesta Preventivo VINCO EVENTI - " + quote.getNome() + " " + quote.getCognome();

            String dataEventoFormatted = quote.getDataEvento() != null 
                    ? quote.getDataEvento().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) 
                    : "Non specificata";

            String dataRichiestaFormatted = quote.getDataRichiesta() != null
                    ? quote.getDataRichiesta().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                    : "Ora";

            String userLang = quote.getLingua() != null && quote.getLingua().equalsIgnoreCase("en") ? "en" : "it";
            String langLabel = userLang.equals("en") ? "English (Inglese)" : "Italiano (Italian)";

            String phoneFormatted = quote.getTelefono() != null && !quote.getTelefono().isBlank() ? quote.getTelefono() : "Non specificato";
            String telHref = quote.getTelefono() != null ? quote.getTelefono().replaceAll("[^\\d+]", "") : "";

            boolean isMatrimonio = quote.getTipoEvento() != null && quote.getTipoEvento().toLowerCase().contains("matrimonio");
            boolean hasTipoCerimonia = isMatrimonio && quote.getTipoCerimonia() != null && !quote.getTipoCerimonia().isBlank();

            // Traduzione messaggi/textarea per l'admin se il messaggio dell'utente è in lingua straniera (con autodetect)
            String messaggioOriginale = quote.getMessaggio() != null && !quote.getMessaggio().isBlank() ? quote.getMessaggio() : "-";
            String messaggioTradotto = "";

            if (!messaggioOriginale.equals("-")) {
                try {
                    String tr = translationService.translate(messaggioOriginale, "autodetect", "it");
                    if (tr != null && !tr.isBlank() && !tr.trim().equalsIgnoreCase(messaggioOriginale.trim())) {
                        messaggioTradotto = tr.trim();
                    }
                } catch (Exception ex) {
                    System.err.println("[WARN EmailService] Impossibile tradurre il messaggio per l'admin: " + ex.getMessage());
                }
            }

            StringBuilder plainTextBuilder = new StringBuilder();
            plainTextBuilder.append(String.format("""
                NUOVA RICHIESTA DI PREVENTIVO - VINCO EVENTI
                ============================================
                
                Dati del Cliente:
                - Nome e Cognome: %s %s
                - Email: %s
                - Telefono: %s
                - Lingua di Navigazione: %s
                
                Dettagli Evento:
                - Data Evento: %s
                - Tipo Evento: %s
                - Location / Luogo: %s
                - Numero Ospiti: %s
                - Momento della Giornata: %s
                """,
                    quote.getNome(), quote.getCognome(),
                    quote.getEmail(), quote.getTelefono(),
                    langLabel,
                    dataEventoFormatted,
                    quote.getTipoEvento() != null ? quote.getTipoEvento() : "Non specificato",
                    quote.getLocation() != null ? quote.getLocation() : "Non specificata",
                    quote.getNumeroOspiti() != null ? quote.getNumeroOspiti() : "Non specificato",
                    quote.getOrarioGiornata() != null ? quote.getOrarioGiornata() : "Non specificato"
            ));

            if (hasTipoCerimonia) {
                plainTextBuilder.append(String.format("- Tipo Cerimonia: %s\n", quote.getTipoCerimonia()));
            }

            plainTextBuilder.append(String.format("""
                - Fascia Budget: %s
                
                Messaggio / Note Aggiuntive (Originale):
                %s
                """,
                    quote.getBudget() != null ? quote.getBudget() : "Non specificato",
                    messaggioOriginale
            ));

            if (!messaggioTradotto.isBlank()) {
                plainTextBuilder.append(String.format("""
                
                Traduzione Messaggio per Admin (in Italiano):
                %s
                """, messaggioTradotto));
            }

            plainTextBuilder.append(String.format("""
                
                Dashboard Admin Direct Link: %s/admin-enzo/preventivi
                --------------------------------------------
                Data Invio Richiesta: %s
                Email automatica dal sistema VINCO EVENTI.
                """,
                    frontendBaseUrl,
                    dataRichiestaFormatted
            ));

            String logoVincoUri = URL_LOGO_VINCO;
            String dashIconUri = URL_DASHBOARD_ICON;
            String googleIconUri = URL_GOOGLE_ICON;
            String appleIconUri = URL_APPLE_ICON;

            StringBuilder htmlBuilder = new StringBuilder();
            htmlBuilder.append("""
                <!DOCTYPE html>
                <html lang="it">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f1f5f9; margin: 0; padding: 20px;">
                  <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid rgba(226, 232, 240, 0.9); box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
                    
                    <!-- Frosted Glass Header -->
                    <div style="background: linear-gradient(135deg, #ffffff 0%%, #f0fdf4 100%%); border-bottom: 1px solid rgba(22, 163, 74, 0.2); padding: 26px 20px; text-align: center;">
                      <table style="width: 100%%; text-align: center;">
                        <tr>
                          <td>
                            <a href="%s/admin-enzo/preventivi" target="_blank" style="text-decoration: none; display: inline-block;">
                              <img src="%s" alt="VINCO EVENTI Logo" width="68" height="68" style="display: block; margin: 0 auto 10px auto; border-radius: 50%%; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);" />
                            </a>
                            <h2 style="margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 1.5px; color: #064e3b;">VINCO EVENTI</h2>
                            <span style="display: inline-block; margin-top: 6px; background-color: #dcfce7; color: #15803d; font-size: 13px; font-weight: 600; padding: 4px 14px; border-radius: 20px; border: 1px solid #bbf7d0;">
                              🔔 Nuova Richiesta di Preventivo
                            </span>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- Body Content -->
                    <div style="padding: 28px 24px;">
                      
                      <h3 style="color: #064e3b; margin-top: 0; border-bottom: 2px solid #10b981; padding-bottom: 8px; font-size: 16px; font-weight: bold;">
                        👤 Dati del Cliente / Client Contact Info
                      </h3>
                      <table style="width: 100%%; border-collapse: collapse; margin-bottom: 22px; font-size: 14px;">
                        <tr>
                          <td style="padding: 9px 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; width: 40%%; color: #064e3b;">Nome e Cognome:</td>
                          <td style="padding: 9px 10px; border-bottom: 1px solid #f1f5f9;">%s %s</td>
                        </tr>
                        <tr>
                          <td style="padding: 9px 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #064e3b;">Email:</td>
                          <td style="padding: 9px 10px; border-bottom: 1px solid #f1f5f9;"><a href="mailto:%s" style="color: #059669; font-weight: bold; text-decoration: underline;">%s</a></td>
                        </tr>
                        <tr>
                          <td style="padding: 9px 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #064e3b;">Telefono / Phone:</td>
                          <td style="padding: 9px 10px; border-bottom: 1px solid #f1f5f9;"><a href="tel:%s" style="color: #059669; font-weight: bold; text-decoration: underline;">%s</a></td>
                        </tr>
                        <tr>
                          <td style="padding: 9px 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #064e3b;">Lingua Form / Language:</td>
                          <td style="padding: 9px 10px; border-bottom: 1px solid #f1f5f9;">%s</td>
                        </tr>
                      </table>

                      <h3 style="color: #064e3b; margin-top: 22px; border-bottom: 2px solid #10b981; padding-bottom: 8px; font-size: 16px; font-weight: bold;">
                        🎉 Dettagli Evento / Event Details
                      </h3>
                      <table style="width: 100%%; border-collapse: collapse; margin-bottom: 22px; font-size: 14px;">
                        <tr>
                          <td style="padding: 9px 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; width: 40%%; color: #064e3b;">Data Evento / Date:</td>
                          <td style="padding: 9px 10px; border-bottom: 1px solid #f1f5f9;">%s</td>
                        </tr>
                        <tr>
                          <td style="padding: 9px 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #064e3b;">Tipo Evento / Event Type:</td>
                          <td style="padding: 9px 10px; border-bottom: 1px solid #f1f5f9;">%s</td>
                        </tr>
                        <tr>
                          <td style="padding: 9px 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #064e3b;">Location / Venue:</td>
                          <td style="padding: 9px 10px; border-bottom: 1px solid #f1f5f9;">%s</td>
                        </tr>
                        <tr>
                          <td style="padding: 9px 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #064e3b;">Numero Ospiti / Guests:</td>
                          <td style="padding: 9px 10px; border-bottom: 1px solid #f1f5f9;">%s</td>
                        </tr>
                        <tr>
                          <td style="padding: 9px 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #064e3b;">Momento Giornata / Time:</td>
                          <td style="padding: 9px 10px; border-bottom: 1px solid #f1f5f9;">%s</td>
                        </tr>
                """.formatted(
                    frontendBaseUrl, logoVincoUri,
                    quote.getNome(), quote.getCognome(),
                    quote.getEmail(), quote.getEmail(),
                    telHref, phoneFormatted,
                    langLabel,
                    dataEventoFormatted,
                    quote.getTipoEvento() != null ? quote.getTipoEvento() : "Non specificato",
                    quote.getLocation() != null ? quote.getLocation() : "Non specificata",
                    quote.getNumeroOspiti() != null ? quote.getNumeroOspiti() : "Non specificato",
                    quote.getOrarioGiornata() != null ? quote.getOrarioGiornata() : "Non specificato"
            ));

            if (hasTipoCerimonia) {
                htmlBuilder.append("""
                        <tr>
                          <td style="padding: 9px 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #064e3b;">Tipo Cerimonia / Ceremony:</td>
                          <td style="padding: 9px 10px; border-bottom: 1px solid #f1f5f9;">%s</td>
                        </tr>
                    """.formatted(quote.getTipoCerimonia()));
            }

            htmlBuilder.append("""
                        <tr>
                          <td style="padding: 9px 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #064e3b;">Budget Stimato:</td>
                          <td style="padding: 9px 10px; border-bottom: 1px solid #f1f5f9;">%s</td>
                        </tr>
                      </table>
                """.formatted(quote.getBudget() != null ? quote.getBudget() : "Non specificato"));

            // Sezione Text Area e Traduzione Automatica per Admin se il messaggio è in lingua straniera
            htmlBuilder.append("""
                      <h3 style="color: #064e3b; margin-top: 22px; border-bottom: 2px solid #10b981; padding-bottom: 8px; font-size: 16px; font-weight: bold;">
                        💬 Messaggio / Note Aggiuntive
                      </h3>
                      <div style="background-color: #f8fafc; border-left: 4px solid #059669; padding: 14px 16px; margin-bottom: 16px; border-radius: 6px; font-size: 14px;">
                        <strong style="color: #064e3b;">Testo Originale dall'Utente:</strong><br/>
                        <span style="white-space: pre-wrap; color: #334155;">%s</span>
                      </div>
                """.formatted(messaggioOriginale));

            if (!messaggioTradotto.isBlank()) {
                String translationTitle = "🇮🇹 Traduzione in Italiano per Admin (Italian Translation):";
                htmlBuilder.append("""
                      <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px 16px; margin-bottom: 16px; border-radius: 6px; font-size: 14px;">
                        <strong style="color: #166534;">%s</strong><br/>
                        <span style="white-space: pre-wrap; color: #15803d;">%s</span>
                      </div>
                """.formatted(translationTitle, messaggioTradotto));
            }

            // Direct CTA Dashboard & Calendar Links Buttons for Admin
            String googleCalUrl = quote.getDataEvento() != null ? buildGoogleCalendarUrl(quote) : "";
            String appleCalUrl = quote.getDataEvento() != null ? buildAppleCalendarUrl(quote) : "";

            if (!googleCalUrl.isBlank()) {
                plainTextBuilder.append(String.format("""
                    
                    Salva Evento in Calendario:
                    - Google Calendar: %s
                    - Apple Calendar / iCal (.ics): %s
                    """, googleCalUrl, appleCalUrl));
            }

            htmlBuilder.append("""
                      <div style="text-align: center; margin: 28px 0 15px 0;">
                        <a href="%s/admin-enzo/preventivi" target="_blank" style="background: linear-gradient(135deg, #10b981 0%%, #059669 100%%); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35); margin-bottom: 14px;">
                          <img src="%s" width="18" height="18" style="vertical-align: middle; margin-right: 8px;" alt="Dashboard" />
                          <span>Apri Dashboard Preventivi</span>
                        </a>
                """.formatted(frontendBaseUrl, dashIconUri));

            if (quote.getDataEvento() != null && !googleCalUrl.isBlank()) {
                htmlBuilder.append("""
                        <div style="margin-top: 10px; text-align: center;">
                          <a href="%s" target="_blank" style="background-color: #ffffff; color: #3c4043; border: 1px solid #dadce0; padding: 11px 20px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px; display: inline-block; box-shadow: 0 2px 6px rgba(60,64,67,0.15); margin: 5px; vertical-align: middle;">
                            <img src="%s" width="18" height="18" style="vertical-align: middle; margin-right: 8px; display: inline-block;" alt="Google Logo" />
                            <span style="vertical-align: middle;">Salva su Google Calendar</span>
                          </a>
                          <a href="%s" target="_blank" style="background-color: #000000; color: #ffffff; padding: 11px 20px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px; display: inline-block; box-shadow: 0 2px 8px rgba(0,0,0,0.3); margin: 5px; vertical-align: middle;">
                            <img src="%s" width="18" height="18" style="vertical-align: middle; margin-right: 8px; display: inline-block;" alt="Apple Logo" />
                            <span style="vertical-align: middle;">Salva su Apple iCal (.ics)</span>
                          </a>
                        </div>
                    """.formatted(googleCalUrl, googleIconUri, appleCalUrl, appleIconUri));
            }

            htmlBuilder.append("""
                      </div>

                      <div style="background-color: #f1f5f9; padding: 12px 15px; border-radius: 8px; font-size: 13px; color: #64748b; margin-top: 20px;">
                        <strong>Data e Ora Ricezione:</strong> %s
                      </div>
                    </div>

                    <!-- Frosted Glass Footer -->
                    <div style="background: linear-gradient(135deg, #f8fafc 0%%, #f1f5f9 100%%); border-top: 1px solid #e2e8f0; color: #64748b; padding: 22px 20px; text-align: center; font-size: 12px;">
                      <p style="margin: 0 0 6px 0; color: #0f172a; font-weight: bold; font-size: 14px; letter-spacing: 0.5px;">VINCO EVENTI</p>
                      <p style="margin: 0; color: #64748b;">Email automatica generata dal sistema <strong>VINCO EVENTI</strong>.</p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(dataRichiestaFormatted));

            byte[] icsBytes = null;
            // Allegato .ics per Apple Mail / iOS / Outlook: salvataggio istantaneo in 1 tap senza chiamate al server
            if (quote.getDataEvento() != null && quoteService != null) {
                try {
                    String icsContent = quoteService.generateIcsContent(quote);
                    if (icsContent != null && !icsContent.isBlank()) {
                        icsBytes = icsContent.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                    }
                } catch (Exception icsEx) {
                    System.err.println("[WARN EmailService] Impossibile allegare file .ics all'email: " + icsEx.getMessage());
                }
            }

            // Tenta prima l'invio ultra-veloce via Brevo REST API su HTTPS (Porta 443 - Imune ai blocchi SMTP cloud)
            boolean sentViaApi = sendViaBrevoApi(
                "vincoeventi@gmail.com",
                subject,
                htmlBuilder.toString(),
                quote.getEmail(),
                quote.getNome() + " " + quote.getCognome(),
                icsBytes != null ? "evento-vinco.ics" : null,
                icsBytes
            );

            if (sentViaApi) {
                return;
            }

            if (mailSender != null) {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

                helper.setFrom(mailFrom, "VINCO EVENTI - Web App");
                helper.setTo("vincoeventi@gmail.com");
                if (quote.getEmail() != null && !quote.getEmail().isBlank()) {
                    helper.setReplyTo(quote.getEmail(), quote.getNome() + " " + quote.getCognome());
                }
                helper.setSubject(subject);
                mimeMessage.setHeader("X-Mailer", "VINCO EVENTI Web Application");
                mimeMessage.setHeader("Auto-Submitted", "auto-generated");
                helper.setText(plainTextBuilder.toString(), htmlBuilder.toString());
                if (icsBytes != null) {
                    helper.addAttachment("evento-vinco.ics", new org.springframework.core.io.ByteArrayResource(icsBytes), "text/calendar; charset=UTF-8");
                }

                mailSender.send(mimeMessage);
                System.out.println(">>> Email di notifica preventivo inviata con successo all'admin VINCO EVENTI via SMTP!");
            } else {
                System.err.println("[WARN EmailService] Impossibile inviare l'email di notifica all'admin via SMTP (JavaMailSender non configurato).");
            }
        } catch (Exception ex) {
            System.err.println("[ERROR EmailService] Impossibile inviare l'email di notifica all'admin: " + ex.getMessage());
        }
    }

    private String buildGoogleCalendarUrl(QuoteRequest quote) {
        if (quote.getDataEvento() == null) return "";
        try {
            String dtStart = quote.getDataEvento().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            String dtEnd = quote.getDataEvento().plusDays(1).format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            String title = java.net.URLEncoder.encode("Evento VINCO EVENTI - " + quote.getNome() + " " + quote.getCognome(), java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");

            StringBuilder detailsSb = new StringBuilder();
            detailsSb.append("Cliente: ").append(quote.getNome()).append(" ").append(quote.getCognome()).append("\n");
            detailsSb.append("Tipo Evento: ").append(quote.getTipoEvento() != null ? quote.getTipoEvento() : "N/D").append("\n");
            detailsSb.append("Email: ").append(quote.getEmail()).append("\n");
            detailsSb.append("Telefono: ").append(quote.getTelefono() != null ? quote.getTelefono() : "N/D").append("\n");
            if (quote.getNumeroOspiti() != null) detailsSb.append("Ospiti: ").append(quote.getNumeroOspiti()).append("\n");
            if (quote.getOrarioGiornata() != null) detailsSb.append("Fascia Oraria: ").append(quote.getOrarioGiornata()).append("\n");
            if (quote.getMessaggio() != null && !quote.getMessaggio().isBlank()) {
                detailsSb.append("Messaggio: ").append(quote.getMessaggio());
            }

            String details = java.net.URLEncoder.encode(detailsSb.toString(), java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");
            String location = java.net.URLEncoder.encode(quote.getLocation() != null ? quote.getLocation() : "", java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");

            return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + title + "&dates=" + dtStart + "/" + dtEnd + "&details=" + details + "&location=" + location;
        } catch (Exception e) {
            return "";
        }
    }

    private String buildAppleCalendarUrl(QuoteRequest quote) {
        // Usa sempre l'URL diretto del backend: i data: URI base64 sono bloccati
        // da tutti i mail client moderni (Gmail, Outlook, Apple Mail) per sicurezza.
        // L'endpoint /calendar.ics è già pubblico (permitAll in SecurityConfig)
        // e serve il file con Content-Disposition: inline per aprirsi direttamente
        // nell'app Calendario di iOS/macOS senza la schermata di iscrizione.
        if (quote.getId() != null) {
            return backendBaseUrl + "/api/quotes/" + quote.getId() + "/calendar.ics";
        }
        return "";
    }

    @Async
    public void sendConfirmationEmailToClient(QuoteRequest quote) {
        if (quote == null || quote.getEmail() == null || quote.getEmail().isBlank()) {
            return;
        }

        if (mailSender == null && (brevoApiKey == null || brevoApiKey.isBlank())) {
            System.out.println("[WARN EmailService] Né JavaMailSender né Brevo API Key configurati. Salto l'invio email cliente.");
            return;
        }

        try {
            boolean isEnglish = quote.getLingua() != null && quote.getLingua().equalsIgnoreCase("en");
            String messaggioOriginale = quote.getMessaggio() != null ? quote.getMessaggio().trim() : "";

            boolean isForeignMessage = false;
            if (!messaggioOriginale.isBlank() && !isEnglish) {
                try {
                    String testTr = translationService.translate(messaggioOriginale, "autodetect", "it");
                    if (testTr != null && !testTr.isBlank() && !testTr.trim().equalsIgnoreCase(messaggioOriginale)) {
                        isForeignMessage = true;
                    }
                } catch (Exception e) {
                    // Fallback silenzioso
                }
            }

            boolean showItalianNotice = isEnglish || isForeignMessage;

            String subject = isEnglish 
                    ? "VINCO EVENTI - Quote Request Confirmation" 
                    : "VINCO EVENTI - Ricezione Richiesta Preventivo";

            String dataEventoFormatted = quote.getDataEvento() != null 
                    ? quote.getDataEvento().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) 
                    : (isEnglish ? "To be specified" : "da definire");

            String plainText;
            String htmlBody;

            String logoVincoUri = URL_LOGO_VINCO;
            String instaIconUri = URL_INSTAGRAM_ICON;
            String phoneIconUri = URL_PHONE_ICON;
            String waIconUri = URL_WHATSAPP_ICON;

            if (isEnglish) {
                plainText = String.format("""
                    Dear %s %s,
                    
                    Thank you for contacting VINCO EVENTI!
                    We have successfully received your request for a personalized quote for your event on %s.
                    
                    Our team will review your details and contact you shortly at %s or via email with custom solutions tailored for your special event.
                    
                    📸 STAY CONNECTED WITH VINCO EVENTI:
                    Follow our official Instagram page to discover our latest shows, live performances, and updates:
                    https://www.instagram.com/vincoeventi/
                    
                    💬 DIRECT CONTACT & ASSISTANCE:
                    - Phone Call: +39 349 294 9669 (tel:+393492949669) - Note: Admin speaks Italian; WhatsApp chat or email recommended for English/foreign language inquiries.
                    - WhatsApp Direct Chat: https://wa.me/393492949669
                    - Email: vincoeventi@gmail.com
                    
                    Best regards,
                    Team VINCO EVENTI
                    """,
                        quote.getNome(), quote.getCognome(),
                        dataEventoFormatted,
                        quote.getTelefono()
                );

                htmlBody = String.format("""
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f1f5f9; margin: 0; padding: 20px;">
                      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid rgba(226, 232, 240, 0.9); box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
                        
                        <!-- Frosted Glass Header Banner -->
                        <div style="background: linear-gradient(135deg, #ffffff 0%%, #f0fdf4 100%%); border-bottom: 1px solid rgba(22, 163, 74, 0.2); padding: 28px 20px; text-align: center;">
                          <table style="width: 100%%; text-align: center;">
                            <tr>
                              <td>
                                <a href="%s" target="_blank" style="text-decoration: none; display: inline-block;">
                                  <img src="%s" alt="VINCO EVENTI Logo" width="70" height="70" style="display: block; margin: 0 auto 12px auto; border-radius: 50%%; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);" />
                                </a>
                                <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1.5px; color: #064e3b;">VINCO EVENTI</h1>
                                <p style="margin: 5px 0 0 0; font-size: 14px; color: #059669; font-weight: 600;">Exclusive Events & Musical Entertainment</p>
                              </td>
                            </tr>
                          </table>
                        </div>

                        <!-- Body Content -->
                        <div style="padding: 30px 25px;">
                          <h2 style="color: #064e3b; margin-top: 0; font-size: 20px;">Dear %s %s,</h2>
                          <p style="font-size: 15px; color: #334155; margin-bottom: 20px;">
                            Thank you for contacting <strong>VINCO EVENTI</strong>!
                          </p>
                          <p style="font-size: 15px; color: #334155; margin-bottom: 25px; line-height: 1.7;">
                            We have successfully received your quote request for your upcoming event scheduled on <strong>%s</strong>. Our team will review your request and reach out to you shortly at <strong>%s</strong> or via email to present a custom proposal tailored to your vision.
                          </p>

                          <!-- Event Summary Card -->
                          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 18px 20px; margin-bottom: 25px;">
                            <h4 style="margin: 0 0 12px 0; color: #064e3b; font-size: 15px; font-weight: bold;">📋 Request Summary:</h4>
                            <table style="width: 100%%; font-size: 14px; color: #334155;">
                              <tr><td style="padding: 5px 0; font-weight: bold; width: 40%%; color: #064e3b;">Event Type:</td><td>%s</td></tr>
                              <tr><td style="padding: 5px 0; font-weight: bold; color: #064e3b;">Location:</td><td>%s</td></tr>
                              <tr><td style="padding: 5px 0; font-weight: bold; color: #064e3b;">Guest Count:</td><td>%s</td></tr>
                              <tr><td style="padding: 5px 0; font-weight: bold; color: #064e3b;">Estimated Budget:</td><td>%s</td></tr>
                            </table>
                          </div>

                          <!-- Instagram CTA Card -->
                          <div style="background: linear-gradient(135deg, #fdfbfb 0%%, #ebedee 100%%); border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
                            <table style="width: 100%%; text-align: center;">
                              <tr>
                                <td>
                                  <a href="https://www.instagram.com/vincoeventi/" target="_blank" style="text-decoration: none;">
                                    <img src="%s" alt="Instagram VINCO EVENTI" width="38" height="38" style="margin-bottom: 8px; display: inline-block; vertical-align: middle;" />
                                  </a>
                                  <h4 style="margin: 5px 0; color: #064e3b; font-size: 16px; font-weight: bold;">Follow VINCO EVENTI on Instagram!</h4>
                                  <p style="margin: 0 0 15px 0; font-size: 14px; color: #475569;">Don't miss our latest shows, live performances, news, and behind-the-scenes content!</p>
                                  <a href="https://www.instagram.com/vincoeventi/" target="_blank" style="background-color: #E1306C; color: #ffffff; padding: 10px 22px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 3px 10px rgba(225,48,108,0.3);">
                                    Follow @vincoeventi
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </div>

                          <!-- Direct Contact & Dialer CTA Card -->
                          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                            <h4 style="margin: 0 0 8px 0; color: #166534; font-size: 16px; font-weight: bold; text-align: center;">💬 Direct Contact & Fast Mobile Calling</h4>
                            <p style="margin: 0 0 15px 0; font-size: 14px; color: #15803d; text-align: center;">
                              Would you like to speak directly with us or ask a quick question? Tap below to call or chat!
                            </p>
                            <table style="width: 100%%; text-align: center;" cellspacing="0" cellpadding="0">
                              <tr>
                                <td style="padding: 6px; text-align: center;">
                                  <a href="tel:+393492949669" style="background-color: #064e3b; color: #ffffff; padding: 12px 18px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block; margin: 4px;">
                                    <img src="%s" alt="Phone" width="16" height="16" style="vertical-align: middle; margin-right: 6px;" />
                                    Call +39 349 294 9669
                                  </a>
                                  <a href="https://wa.me/393492949669" target="_blank" style="background-color: #25D366; color: #ffffff; padding: 12px 18px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block; margin: 4px;">
                                    <img src="%s" alt="WhatsApp" width="16" height="16" style="vertical-align: middle; margin-right: 6px;" />
                                    WhatsApp Chat
                                  </a>
                                </td>
                              </tr>
                            </table>
                            <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 12px 14px; margin-top: 14px; font-size: 13px; color: #854d0e; text-align: left; line-height: 1.5;">
                              <strong>ℹ️ Important Note:</strong> Our management team speaks exclusively Italian. For inquiries in English or other foreign languages, we kindly recommend contacting us via <strong>WhatsApp chat</strong> or <strong>Email</strong> so we can assist you promptly and accurately.
                            </div>
                          </div>

                          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />

                          <p style="margin-bottom: 0; font-size: 14px; color: #475569;">
                            Best regards,<br/>
                            <strong style="color: #064e3b; font-size: 15px;">Team VINCO EVENTI</strong><br/>
                            ✉️ <a href="mailto:vincoeventi@gmail.com" style="color: #059669; text-decoration: none; font-weight: bold;">vincoeventi@gmail.com</a>
                          </p>
                        </div>

                        <!-- Frosted Glass Footer -->
                        <div style="background: linear-gradient(135deg, #f8fafc 0%%, #f1f5f9 100%%); border-top: 1px solid #e2e8f0; color: #64748b; padding: 22px 20px; text-align: center; font-size: 12px;">
                          <p style="margin: 0 0 6px 0; color: #0f172a; font-weight: bold; font-size: 14px; letter-spacing: 0.5px;">VINCO EVENTI</p>
                          <p style="margin: 0; color: #64748b;">© VINCO EVENTI - All rights reserved.</p>
                        </div>
                      </div>
                    </body>
                    </html>
                    """,
                        frontendBaseUrl,
                        logoVincoUri,
                        quote.getNome(), quote.getCognome(),
                        dataEventoFormatted,
                        quote.getTelefono(),
                        quote.getTipoEvento() != null ? quote.getTipoEvento() : "Not specified",
                        quote.getLocation() != null ? quote.getLocation() : "Not specified",
                        quote.getNumeroOspiti() != null ? quote.getNumeroOspiti() : "Not specified",
                        quote.getBudget() != null ? quote.getBudget() : "Not specified",
                        instaIconUri,
                        phoneIconUri,
                        waIconUri
                );
            } else {
                plainText = String.format("""
                    Gentile %s %s,
                    
                    Grazie per aver contattato VINCO EVENTI!
                    Abbiamo ricevuto la tua richiesta di preventivo per l'evento in data %s.
                    
                    Il nostro team provvederà a ricontattarti al più presto al numero %s o via email per proporti la migliore soluzione su misura per te.
                    
                    📸 RESTA AGGIORNATO CON VINCO EVENTI:
                    Segui la nostra pagina Instagram ufficiale per non perderti tutte le novità, i nostri show dal vivo ed i momenti più belli:
                    https://www.instagram.com/vincoeventi/
                    
                    💬 CONTATTO DIRETTO & CHIAMATA RAPIDA:
                    - Chiamata Telefonica: +39 349 294 9669 (tel:+393492949669)%s
                    - Chat WhatsApp: https://wa.me/393492949669
                    - Email: vincoeventi@gmail.com
                    
                    Cordiali saluti,
                    Team VINCO EVENTI
                    """,
                        quote.getNome(), quote.getCognome(),
                        dataEventoFormatted,
                        quote.getTelefono(),
                        showItalianNotice ? " (Nota: La direzione parla solo italiano; consigliamo WhatsApp o email per lingue straniere)" : ""
                );

                String itLanguageNoticeHtml = showItalianNotice ? """
                            <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 12px 14px; margin-top: 14px; font-size: 13px; color: #854d0e; text-align: left; line-height: 1.5;">
                              <strong>ℹ️ Nota sulle Chiamate Telefoniche:</strong> La nostra direzione parla esclusivamente in lingua italiana. In caso di comunicazioni in lingua straniera, vi consigliamo di contattarci via <strong>WhatsApp</strong> o <strong>Email</strong> per offrirvi la migliore assistenza.
                            </div>
                    """ : "";

                htmlBody = String.format("""
                    <!DOCTYPE html>
                    <html lang="it">
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f1f5f9; margin: 0; padding: 20px;">
                      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid rgba(226, 232, 240, 0.9); box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
                        
                        <!-- Frosted Glass Header Banner -->
                        <div style="background: linear-gradient(135deg, #ffffff 0%%, #f0fdf4 100%%); border-bottom: 1px solid rgba(22, 163, 74, 0.2); padding: 28px 20px; text-align: center;">
                          <table style="width: 100%%; text-align: center;">
                            <tr>
                              <td>
                                <a href="%s" target="_blank" style="text-decoration: none; display: inline-block;">
                                  <img src="%s" alt="VINCO EVENTI Logo" width="70" height="70" style="display: block; margin: 0 auto 12px auto; border-radius: 50%%; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);" />
                                </a>
                                <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1.5px; color: #064e3b;">VINCO EVENTI</h1>
                                <p style="margin: 5px 0 0 0; font-size: 14px; color: #059669; font-weight: 600;">Organizzazione Eventi & Intrattenimento Musicale</p>
                              </td>
                            </tr>
                          </table>
                        </div>

                        <!-- Body Content -->
                        <div style="padding: 30px 25px;">
                          <h2 style="color: #064e3b; margin-top: 0; font-size: 20px;">Gentile %s %s,</h2>
                          <p style="font-size: 15px; color: #334155; margin-bottom: 20px;">
                            Grazie per aver contattato <strong>VINCO EVENTI</strong>!
                          </p>
                          <p style="font-size: 15px; color: #334155; margin-bottom: 25px; line-height: 1.7;">
                            Abbiamo ricevuto con successo la tua richiesta di preventivo per l'evento in data <strong>%s</strong>. Il nostro team provvederà a ricontattarti al più presto al numero <strong>%s</strong> o via email per proporti la migliore soluzione su misura per le tue esigenze.
                          </p>

                          <!-- Event Summary Card -->
                          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 18px 20px; margin-bottom: 25px;">
                            <h4 style="margin: 0 0 12px 0; color: #064e3b; font-size: 15px; font-weight: bold;">📋 Riepilogo della tua Richiesta:</h4>
                            <table style="width: 100%%; font-size: 14px; color: #334155;">
                              <tr><td style="padding: 5px 0; font-weight: bold; width: 40%%; color: #064e3b;">Tipo Evento:</td><td>%s</td></tr>
                              <tr><td style="padding: 5px 0; font-weight: bold; color: #064e3b;">Location:</td><td>%s</td></tr>
                              <tr><td style="padding: 5px 0; font-weight: bold; color: #064e3b;">Numero Ospiti:</td><td>%s</td></tr>
                              <tr><td style="padding: 5px 0; font-weight: bold; color: #064e3b;">Fascia Budget:</td><td>%s</td></tr>
                            </table>
                          </div>

                          <!-- Instagram CTA Card -->
                          <div style="background: linear-gradient(135deg, #fdfbfb 0%%, #ebedee 100%%); border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
                            <table style="width: 100%%; text-align: center;">
                              <tr>
                                <td>
                                  <a href="https://www.instagram.com/vincoeventi/" target="_blank" style="text-decoration: none;">
                                    <img src="%s" alt="Instagram VINCO EVENTI" width="38" height="38" style="margin-bottom: 8px; display: inline-block; vertical-align: middle;" />
                                  </a>
                                  <h4 style="margin: 5px 0; color: #064e3b; font-size: 16px; font-weight: bold;">Segui VINCO EVENTI su Instagram!</h4>
                                  <p style="margin: 0 0 15px 0; font-size: 14px; color: #475569;">Non perderti tutte le novità, i video delle nostre esibizioni dal vivo e i momenti più spettacolari!</p>
                                  <a href="https://www.instagram.com/vincoeventi/" target="_blank" style="background-color: #E1306C; color: #ffffff; padding: 10px 22px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 3px 10px rgba(225,48,108,0.3);">
                                    Segui @vincoeventi
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </div>

                          <!-- Direct Contact & Dialer CTA Card -->
                          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                            <h4 style="margin: 0 0 8px 0; color: #166534; font-size: 16px; font-weight: bold; text-align: center;">💬 Contatto Diretto & Chiamata Rapida</h4>
                            <p style="margin: 0 0 15px 0; font-size: 14px; color: #15803d; text-align: center;">
                              Vuoi parlare direttamente con noi o porci una domanda immediata? Clicca qui sotto per chiamare o scriverci su WhatsApp:
                            </p>
                            <table style="width: 100%%; text-align: center;" cellspacing="0" cellpadding="0">
                              <tr>
                                <td style="padding: 6px; text-align: center;">
                                  <a href="tel:+393492949669" style="background-color: #064e3b; color: #ffffff; padding: 12px 18px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block; margin: 4px;">
                                    <img src="%s" alt="Telefono" width="16" height="16" style="vertical-align: middle; margin-right: 6px;" />
                                    Chiama +39 349 294 9669
                                  </a>
                                  <a href="https://wa.me/393492949669" target="_blank" style="background-color: #25D366; color: #ffffff; padding: 12px 18px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block; margin: 4px;">
                                    <img src="%s" alt="WhatsApp" width="16" height="16" style="vertical-align: middle; margin-right: 6px;" />
                                    Scrivici su WhatsApp
                                  </a>
                                </td>
                              </tr>
                            </table>
                            %s
                          </div>

                          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />

                          <p style="margin-bottom: 0; font-size: 14px; color: #475569;">
                            Cordiali saluti,<br/>
                            <strong style="color: #064e3b; font-size: 15px;">Team VINCO EVENTI</strong><br/>
                            ✉️ <a href="mailto:vincoeventi@gmail.com" style="color: #059669; text-decoration: none; font-weight: bold;">vincoeventi@gmail.com</a>
                          </p>
                        </div>

                        <!-- Frosted Glass Footer -->
                        <div style="background: linear-gradient(135deg, #f8fafc 0%%, #f1f5f9 100%%); border-top: 1px solid #e2e8f0; color: #64748b; padding: 22px 20px; text-align: center; font-size: 12px;">
                          <p style="margin: 0 0 6px 0; color: #0f172a; font-weight: bold; font-size: 14px; letter-spacing: 0.5px;">VINCO EVENTI</p>
                          <p style="margin: 0; color: #64748b;">© VINCO EVENTI - Tutti i diritti riservati.</p>
                        </div>
                      </div>
                    </body>
                    </html>
                    """,
                        frontendBaseUrl,
                        logoVincoUri,
                        quote.getNome(), quote.getCognome(),
                        dataEventoFormatted,
                        quote.getTelefono(),
                        quote.getTipoEvento() != null ? quote.getTipoEvento() : "Non specificato",
                        quote.getLocation() != null ? quote.getLocation() : "Non specificata",
                        quote.getNumeroOspiti() != null ? quote.getNumeroOspiti() : "Non specificato",
                        quote.getBudget() != null ? quote.getBudget() : "Non specificato",
                        instaIconUri,
                        phoneIconUri,
                        waIconUri,
                        itLanguageNoticeHtml
                );
            }            // Tenta prima l'invio via Brevo REST API su HTTPS (Porta 443)
            boolean sentViaApi = sendViaBrevoApi(
                quote.getEmail(),
                subject,
                htmlBody,
                "vincoeventi@gmail.com",
                "VINCO EVENTI",
                null,
                null
            );

            if (sentViaApi) {
                return;
            }

            if (mailSender != null) {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

                helper.setFrom(mailFrom, "VINCO EVENTI");
                helper.setReplyTo("vincoeventi@gmail.com", "VINCO EVENTI");
                helper.setTo(quote.getEmail());
                helper.setSubject(subject);
                mimeMessage.setHeader("X-Mailer", "VINCO EVENTI Web Application");
                mimeMessage.setHeader("Auto-Submitted", "auto-generated");
                helper.setText(plainText, htmlBody);

                mailSender.send(mimeMessage);
                System.out.println(">>> Email di conferma inviata con successo al cliente VINCO EVENTI via SMTP: " + quote.getEmail());
            } else {
                System.err.println("[WARN EmailService] Impossibile inviare l'email al cliente via SMTP (JavaMailSender non configurato).");
            }
        } catch (Exception ex) {
            System.err.println("[ERROR EmailService] Impossibile inviare l'email al cliente: " + ex.getMessage());
        }
    }

    /**
     * Report di controllo mensile & Keep-Alive automatico per Brevo.
     * Esegue l'invio il 1° giorno di ogni mese alle ore 09:00 AM UTC.
     * Mantiene la chiave Brevo attiva all'infinito (reset dei 90 giorni di inattività).
     */
    @Scheduled(cron = "0 0 9 1 * ?")
    public void sendMonthlyKeepAliveEmail() {
        String nowStr = java.time.ZonedDateTime.now(java.time.ZoneId.of("Europe/Rome"))
                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));

        String htmlBody = """
            <!DOCTYPE html>
            <html lang="it">
            <head><meta charset="UTF-8"></head>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f1f5f9; margin: 0; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 25px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <h2 style="color: #064e3b; margin-top: 0;">💚 VINCO EVENTI - System Heartbeat</h2>
                <p style="font-size: 15px; color: #334155;">
                  Questo è un messaggio automatico mensile inviato dal sistema per verificare il corretto funzionamento del servizio email e mantenere attiva la chiave Brevo all'infinito.
                </p>
                <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px; border-radius: 6px; margin: 20px 0; font-size: 14px;">
                  <strong>✅ Stato Servizio:</strong> ATTIVO & OPERATIVO<br/>
                  <strong>Data Esecuzione:</strong> %s
                </div>
                <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
                  Generato automaticamente dal backend VINCO EVENTI su Render.
                </p>
              </div>
            </body>
            </html>
            """.formatted(nowStr);

        boolean sentViaApi = sendViaBrevoApi(
            "vincoeventi@gmail.com",
            "🟢 VINCO EVENTI - Report Mensile & Keep-Alive Sistema",
            htmlBody,
            null,
            null,
            null,
            null
        );

        if (sentViaApi) {
            return;
        }

        if (mailSender == null) {
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(mailFrom, "VINCO EVENTI - System Health");
            helper.setTo("vincoeventi@gmail.com");
            helper.setSubject("🟢 VINCO EVENTI - Report Mensile & Keep-Alive Sistema");
            helper.setText("VINCO EVENTI - System Heartbeat OK - " + nowStr, htmlBody);
            mailSender.send(mimeMessage);
            System.out.println(">>> [INFO EmailService] Email mensile di Keep-Alive inviata con successo all'admin via SMTP!");
        } catch (Exception ex) {
            System.err.println("[WARN EmailService] Impossibile inviare l'email mensile di Keep-Alive via SMTP: " + ex.getMessage());
        }
    }

    private boolean sendViaBrevoApi(String to, String subject, String htmlContent, String replyToEmail, String replyToName, String attachmentName, byte[] attachmentBytes) {
        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            return false;
        }

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            String senderEmail = mailFrom != null && !mailFrom.isBlank() ? mailFrom : "vincoeventi@gmail.com";
            
            StringBuilder jsonSb = new StringBuilder();
            jsonSb.append("{");
            jsonSb.append("\"sender\":{\"name\":\"VINCO EVENTI\",\"email\":\"").append(escapeJson(senderEmail)).append("\"},");
            jsonSb.append("\"to\":[{\"email\":\"").append(escapeJson(to)).append("\"}],");
            jsonSb.append("\"subject\":\"").append(escapeJson(subject)).append("\",");
            jsonSb.append("\"htmlContent\":\"").append(escapeJson(htmlContent)).append("\"");

            if (replyToEmail != null && !replyToEmail.isBlank()) {
                String rName = replyToName != null && !replyToName.isBlank() ? replyToName : "VINCO EVENTI";
                jsonSb.append(",\"replyTo\":{\"email\":\"").append(escapeJson(replyToEmail)).append("\",\"name\":\"").append(escapeJson(rName)).append("\"}");
            }

            if (attachmentBytes != null && attachmentBytes.length > 0 && attachmentName != null && !attachmentName.isBlank()) {
                String base64Content = Base64.getEncoder().encodeToString(attachmentBytes);
                jsonSb.append(",\"attachment\":[{\"name\":\"").append(escapeJson(attachmentName)).append("\",\"content\":\"").append(base64Content).append("\"}]");
            }

            jsonSb.append("}");

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .header("Content-Type", "application/json")
                    .header("api-key", brevoApiKey.trim())
                    .POST(HttpRequest.BodyPublishers.ofString(jsonSb.toString(), java.nio.charset.StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                System.out.println(">>> [SUCCESS EmailService] Email inviata con successo via Brevo HTTPS API (Porta 443) a: " + to);
                return true;
            } else {
                System.err.println("[WARN EmailService] Errore risposta Brevo HTTPS API (" + response.statusCode() + "): " + response.body());
            }
        } catch (Exception e) {
            System.err.println("[WARN EmailService] Eccezione invio Brevo HTTPS API: " + e.getMessage());
        }
        return false;
    }

    private String escapeJson(String text) {
        if (text == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < text.length(); i++) {
            char ch = text.charAt(i);
            switch (ch) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (ch <= 0x1F) {
                        sb.append(String.format("\\u%04x", (int) ch));
                    } else {
                        sb.append(ch);
                    }
                    break;
            }
        }
        return sb.toString();
    }
}
