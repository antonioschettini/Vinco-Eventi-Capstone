package antonioschettini.backend.services;

import antonioschettini.backend.entities.QuoteRequest;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private TranslationService translationService;

    private void attachInlineResources(MimeMessageHelper helper) {
        try {
            ClassPathResource logoRes = new ClassPathResource("static/images/logo-vinco-tondo.png");
            if (logoRes.exists()) {
                helper.addInline("logoVinco", logoRes, "image/png");
            }
            ClassPathResource instaRes = new ClassPathResource("static/images/instagram-icon.png");
            if (instaRes.exists()) {
                helper.addInline("instagramIcon", instaRes, "image/png");
            }
            ClassPathResource waRes = new ClassPathResource("static/images/whatsapp-icon.png");
            if (waRes.exists()) {
                helper.addInline("whatsappIcon", waRes, "image/png");
            }
            ClassPathResource phoneRes = new ClassPathResource("static/images/phone-icon.png");
            if (phoneRes.exists()) {
                helper.addInline("phoneIcon", phoneRes, "image/png");
            }
        } catch (Exception e) {
            System.err.println("[WARN EmailService] Impossibile allegare immagini inline CID: " + e.getMessage());
        }
    }

    @Async
    public void sendQuoteNotificationEmail(QuoteRequest quote) {
        if (mailSender == null) {
            System.out.println("[WARN EmailService] JavaMailSender non configurato. Salto l'invio email admin.");
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom("vincoeventi@gmail.com", "VINCO EVENTI - Web App");
            helper.setTo("vincoeventi@gmail.com");
            if (quote.getEmail() != null && !quote.getEmail().isBlank()) {
                helper.setReplyTo(quote.getEmail(), quote.getNome() + " " + quote.getCognome());
            }

            String subject = "Richiesta Preventivo VINCO EVENTI - " + quote.getNome() + " " + quote.getCognome();
            helper.setSubject(subject);

            mimeMessage.setHeader("X-Mailer", "VINCO EVENTI Web Application");
            mimeMessage.setHeader("Auto-Submitted", "auto-generated");

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

            // Traduzione messaggi/textarea per l'admin SOLO se l'utente ha compilato il form in lingua estera (es. en)
            String messaggioOriginale = quote.getMessaggio() != null && !quote.getMessaggio().isBlank() ? quote.getMessaggio() : "-";
            String messaggioTradotto = "";
            boolean isForeignLang = userLang.equals("en");

            if (isForeignLang && !messaggioOriginale.equals("-")) {
                messaggioTradotto = translationService.translate(messaggioOriginale, "en", "it");
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

            if (isForeignLang && !messaggioTradotto.isBlank()) {
                plainTextBuilder.append(String.format("""
                
                Traduzione Messaggio per Admin (in Italiano):
                %s
                """, messaggioTradotto));
            }

            plainTextBuilder.append(String.format("""
                
                Dashboard Admin Direct Link: http://localhost:5173/admin/preventivi
                --------------------------------------------
                Data Invio Richiesta: %s
                Email automatica dal sistema VINCO EVENTI.
                """,
                    dataRichiestaFormatted
            ));

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
                            <a href="http://localhost:5173/admin/preventivi" target="_blank" style="text-decoration: none; display: inline-block;">
                              <img src="cid:logoVinco" alt="VINCO EVENTI Logo" width="68" height="68" style="display: block; margin: 0 auto 10px auto; border-radius: 50%%; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);" />
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

            // Sezione Text Area e Traduzione Automatica per Admin (SOLO se il form è stato compilato in lingua straniera)
            htmlBuilder.append("""
                      <h3 style="color: #064e3b; margin-top: 22px; border-bottom: 2px solid #10b981; padding-bottom: 8px; font-size: 16px; font-weight: bold;">
                        💬 Messaggio / Note Aggiuntive
                      </h3>
                      <div style="background-color: #f8fafc; border-left: 4px solid #059669; padding: 14px 16px; margin-bottom: 16px; border-radius: 6px; font-size: 14px;">
                        <strong style="color: #064e3b;">Testo Originale dall'Utente:</strong><br/>
                        <span style="white-space: pre-wrap; color: #334155;">%s</span>
                      </div>
                """.formatted(messaggioOriginale));

            if (isForeignLang && !messaggioTradotto.isBlank() && !messaggioTradotto.equalsIgnoreCase(messaggioOriginale)) {
                String translationTitle = "🇮🇹 Traduzione in Italiano per Admin (Italian Translation):";
                htmlBuilder.append("""
                      <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px 16px; margin-bottom: 16px; border-radius: 6px; font-size: 14px;">
                        <strong style="color: #166534;">%s</strong><br/>
                        <span style="white-space: pre-wrap; color: #15803d;">%s</span>
                      </div>
                """.formatted(translationTitle, messaggioTradotto));
            }

            // Direct CTA Dashboard Link Button for Admin
            htmlBuilder.append("""
                      <div style="text-align: center; margin: 28px 0 15px 0;">
                        <a href="http://localhost:5173/admin/preventivi" target="_blank" style="background: linear-gradient(135deg, #10b981 0%%, #059669 100%%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);">
                          📊 Apri Dashboard Preventivi
                        </a>
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

            helper.setText(plainTextBuilder.toString(), htmlBuilder.toString());
            attachInlineResources(helper);
            mailSender.send(mimeMessage);
            System.out.println(">>> Email di notifica preventivo inviata con successo all'admin VINCO EVENTI!");
        } catch (Exception ex) {
            System.err.println("[ERROR EmailService] Impossibile inviare l'email di notifica all'admin: " + ex.getMessage());
        }
    }

    @Async
    public void sendConfirmationEmailToClient(QuoteRequest quote) {
        if (mailSender == null || quote.getEmail() == null || quote.getEmail().isBlank()) {
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            boolean isEnglish = quote.getLingua() != null && quote.getLingua().equalsIgnoreCase("en");

            helper.setFrom("vincoeventi@gmail.com", "VINCO EVENTI");
            helper.setTo(quote.getEmail());
            
            String subject = isEnglish 
                    ? "VINCO EVENTI - Quote Request Confirmation" 
                    : "VINCO EVENTI - Ricezione Richiesta Preventivo";
            helper.setSubject(subject);

            mimeMessage.setHeader("X-Mailer", "VINCO EVENTI Web Application");
            mimeMessage.setHeader("Auto-Submitted", "auto-generated");

            String dataEventoFormatted = quote.getDataEvento() != null 
                    ? quote.getDataEvento().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) 
                    : (isEnglish ? "To be specified" : "da definire");

            String plainText;
            String htmlBody;

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
                    - Phone Call: +39 349 294 9669 (tel:+393492949669)
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
                                <a href="https://www.vincoeventi.it" target="_blank" style="text-decoration: none; display: inline-block;">
                                  <img src="cid:logoVinco" alt="VINCO EVENTI Logo" width="70" height="70" style="display: block; margin: 0 auto 12px auto; border-radius: 50%%; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);" />
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
                                    <img src="cid:instagramIcon" alt="Instagram VINCO EVENTI" width="38" height="38" style="margin-bottom: 8px; display: inline-block; vertical-align: middle;" />
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
                                    <img src="cid:phoneIcon" alt="Phone" width="16" height="16" style="vertical-align: middle; margin-right: 6px;" />
                                    Call +39 349 294 9669
                                  </a>
                                  <a href="https://wa.me/393492949669" target="_blank" style="background-color: #25D366; color: #ffffff; padding: 12px 18px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block; margin: 4px;">
                                    <img src="cid:whatsappIcon" alt="WhatsApp" width="16" height="16" style="vertical-align: middle; margin-right: 6px;" />
                                    WhatsApp Chat
                                  </a>
                                </td>
                              </tr>
                            </table>
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
                        quote.getNome(), quote.getCognome(),
                        dataEventoFormatted,
                        quote.getTelefono(),
                        quote.getTipoEvento() != null ? quote.getTipoEvento() : "Not specified",
                        quote.getLocation() != null ? quote.getLocation() : "Not specified",
                        quote.getNumeroOspiti() != null ? quote.getNumeroOspiti() : "Not specified",
                        quote.getBudget() != null ? quote.getBudget() : "Not specified"
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
                    - Chiamata Telefonica: +39 349 294 9669 (tel:+393492949669)
                    - Chat WhatsApp: https://wa.me/393492949669
                    - Email: vincoeventi@gmail.com
                    
                    Cordiali saluti,
                    Team VINCO EVENTI
                    """,
                        quote.getNome(), quote.getCognome(),
                        dataEventoFormatted,
                        quote.getTelefono()
                );

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
                                <a href="https://www.vincoeventi.it" target="_blank" style="text-decoration: none; display: inline-block;">
                                  <img src="cid:logoVinco" alt="VINCO EVENTI Logo" width="70" height="70" style="display: block; margin: 0 auto 12px auto; border-radius: 50%%; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);" />
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
                                    <img src="cid:instagramIcon" alt="Instagram VINCO EVENTI" width="38" height="38" style="margin-bottom: 8px; display: inline-block; vertical-align: middle;" />
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
                                    <img src="cid:phoneIcon" alt="Telefono" width="16" height="16" style="vertical-align: middle; margin-right: 6px;" />
                                    Chiama +39 349 294 9669
                                  </a>
                                  <a href="https://wa.me/393492949669" target="_blank" style="background-color: #25D366; color: #ffffff; padding: 12px 18px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block; margin: 4px;">
                                    <img src="cid:whatsappIcon" alt="WhatsApp" width="16" height="16" style="vertical-align: middle; margin-right: 6px;" />
                                    Scrivici su WhatsApp
                                  </a>
                                </td>
                              </tr>
                            </table>
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
                        quote.getNome(), quote.getCognome(),
                        dataEventoFormatted,
                        quote.getTelefono(),
                        quote.getTipoEvento() != null ? quote.getTipoEvento() : "Non specificato",
                        quote.getLocation() != null ? quote.getLocation() : "Non specificata",
                        quote.getNumeroOspiti() != null ? quote.getNumeroOspiti() : "Non specificato",
                        quote.getBudget() != null ? quote.getBudget() : "Non specificato"
                );
            }

            helper.setText(plainText, htmlBody);
            attachInlineResources(helper);
            mailSender.send(mimeMessage);
            System.out.println(">>> Email di conferma inviata con successo al cliente VINCO EVENTI: " + quote.getEmail());
        } catch (Exception ex) {
            System.err.println("[ERROR EmailService] Impossibile inviare l'email al cliente: " + ex.getMessage());
        }
    }
}
