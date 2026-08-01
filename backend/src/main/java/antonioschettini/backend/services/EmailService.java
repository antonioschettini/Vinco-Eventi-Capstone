package antonioschettini.backend.services;

import antonioschettini.backend.entities.QuoteRequest;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Async
    public void sendQuoteNotificationEmail(QuoteRequest quote) {
        if (mailSender == null) {
            System.out.println("[WARN EmailService] JavaMailSender non configurato. Salto l'invio email.");
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            // Intestazioni per evitare i filtri Anti-Spam (SPF/DKIM alignment e Reply-To corretto)
            helper.setFrom("vincoeventi@gmail.com", "Vinco Eventi - Sito Web");
            helper.setTo("vincoeventi@gmail.com");
            if (quote.getEmail() != null && !quote.getEmail().isBlank()) {
                helper.setReplyTo(quote.getEmail(), quote.getNome() + " " + quote.getCognome());
            }

            // Oggetto richiesto: Richiesta Preventivo Nome+Cognome
            String subject = "Richiesta Preventivo " + quote.getNome() + " " + quote.getCognome();
            helper.setSubject(subject);

            // Header tecnici per reputazione antispam
            mimeMessage.setHeader("X-Mailer", "Vinco Eventi Web Application");
            mimeMessage.setHeader("Auto-Submitted", "auto-generated");

            String dataEventoFormatted = quote.getDataEvento() != null 
                    ? quote.getDataEvento().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) 
                    : "Non specificata";

            String dataRichiestaFormatted = quote.getDataRichiesta() != null
                    ? quote.getDataRichiesta().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                    : "Ora";

            String phoneFormatted = quote.getTelefono() != null && !quote.getTelefono().isBlank() ? quote.getTelefono() : "Non specificato";
            String telHref = quote.getTelefono() != null ? quote.getTelefono().replaceAll("[^\\d+]", "") : "";

            // Testo Semplice (Plain Text Alternative per filtri antispam)
            String plainText = String.format("""
                NUOVA RICHIESTA DI PREVENTIVO - VINCO EVENTI
                ============================================
                
                Dati del Cliente:
                - Nome e Cognome: %s %s
                - Email: %s
                - Telefono: %s
                
                Dettagli Evento:
                - Data Evento: %s
                - Tipo Evento: %s
                - Location: %s
                - Numero Ospiti: %s
                - Orario / Momento della Giornata: %s
                - Tipo Cerimonia: %s
                - Budget stimato: %s
                
                Messaggio / Note aggiuntive:
                %s
                
                --------------------------------------------
                Data Invio Richiesta: %s
                Email automatica dal sito web Vinco Eventi.
                """,
                    quote.getNome(), quote.getCognome(),
                    quote.getEmail(), quote.getTelefono(),
                    dataEventoFormatted,
                    quote.getTipoEvento() != null ? quote.getTipoEvento() : "Non specificato",
                    quote.getLocation() != null ? quote.getLocation() : "Non specificata",
                    quote.getNumeroOspiti() != null ? quote.getNumeroOspiti() : "Non specificato",
                    quote.getOrarioGiornata() != null ? quote.getOrarioGiornata() : "Non specificato",
                    quote.getTipoCerimonia() != null && !quote.getTipoCerimonia().isBlank() ? quote.getTipoCerimonia() : "Non specificato",
                    quote.getBudget() != null ? quote.getBudget() : "Non specificato",
                    quote.getMessaggio() != null && !quote.getMessaggio().isBlank() ? quote.getMessaggio() : "-",
                    dataRichiestaFormatted
            );

            // Testo HTML elegante e strutturato
            String htmlBody = String.format("""
                <!DOCTYPE html>
                <html lang="it">
                <head>
                  <meta charset="UTF-8">
                </head>
                <body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #222222; background-color: #f4f6f8; margin: 0; padding: 20px;">
                  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    <div style="background-color: #0b3c26; color: #ffffff; padding: 24px 20px; text-center;">
                      <h2 style="margin: 0; font-size: 22px; font-weight: bold;">🔔 Nuova Richiesta di Preventivo</h2>
                      <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Ricevuta dal form del sito Vinco Eventi</p>
                    </div>
                    <div style="padding: 24px 20px;">
                      <table style="width: 100%%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold; width: 40%%; color: #0b3c26;">Nome e Cognome:</td>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; width: 60%%;">%s %s</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold; color: #0b3c26;">Email:</td>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;"><a href="mailto:%s" style="color: #0b3c26; text-decoration: underline;">%s</a></td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold; color: #0b3c26;">Telefono:</td>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;"><a href="tel:%s" style="color: #0b3c26; text-decoration: underline;">%s</a></td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold; color: #0b3c26;">Data Evento:</td>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">%s</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold; color: #0b3c26;">Tipo Evento:</td>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">%s</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold; color: #0b3c26;">Location:</td>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">%s</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold; color: #0b3c26;">Numero Ospiti:</td>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">%s</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold; color: #0b3c26;">Orario / Giornata:</td>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">%s</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold; color: #0b3c26;">Tipo Cerimonia:</td>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">%s</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold; color: #0b3c26;">Budget:</td>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">%s</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-weight: bold; color: #0b3c26; vertical-align: top;">Messaggio / Dettagli:</td>
                          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; white-space: pre-wrap;">%s</td>
                        </tr>
                      </table>
                      <div style="background-color: #f8f9fa; padding: 12px 15px; border-radius: 6px; font-size: 13px; color: #666666;">
                        <strong>Data ricezione richiesta:</strong> %s
                      </div>
                    </div>
                    <div style="background-color: #f1f3f5; padding: 15px 20px; text-align: center; font-size: 12px; color: #777777; border-top: 1px solid #e9ecef;">
                      Email automatica generata dal sistema <strong>Vinco Eventi</strong>.
                    </div>
                  </div>
                </body>
                </html>
                """,
                    quote.getNome(), quote.getCognome(),
                    quote.getEmail(), quote.getEmail(),
                    telHref, phoneFormatted,
                    dataEventoFormatted,
                    quote.getTipoEvento() != null ? quote.getTipoEvento() : "Non specificato",
                    quote.getLocation() != null ? quote.getLocation() : "Non specificata",
                    quote.getNumeroOspiti() != null ? quote.getNumeroOspiti() : "Non specificato",
                    quote.getOrarioGiornata() != null ? quote.getOrarioGiornata() : "Non specificato",
                    quote.getTipoCerimonia() != null && !quote.getTipoCerimonia().isBlank() ? quote.getTipoCerimonia() : "Non specificato",
                    quote.getBudget() != null ? quote.getBudget() : "Non specificato",
                    quote.getMessaggio() != null && !quote.getMessaggio().isBlank() ? quote.getMessaggio() : "-",
                    dataRichiestaFormatted
            );

            // helper.setText(plainText, htmlBody) invia la mail in formato multipart per superare le verifiche antispam
            helper.setText(plainText, htmlBody);
            mailSender.send(mimeMessage);
            System.out.println(">>> Email di notifica preventivo inviata con successo a vincoeventi@gmail.com!");
        } catch (Exception ex) {
            System.err.println("[ERROR EmailService] Impossibile inviare l'email di notifica a vincoeventi@gmail.com: " + ex.getMessage());
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

            helper.setFrom("vincoeventi@gmail.com", "Vinco Eventi");
            helper.setTo(quote.getEmail());
            helper.setSubject("Vinco Eventi - Ricezione Richiesta Preventivo");

            mimeMessage.setHeader("X-Mailer", "Vinco Eventi Web Application");
            mimeMessage.setHeader("Auto-Submitted", "auto-generated");

            String dataEventoFormatted = quote.getDataEvento() != null 
                    ? quote.getDataEvento().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) 
                    : "da definire";

            String plainText = String.format("""
                Gentile %s %s,
                
                Grazie per aver contattato VINCO EVENTI!
                Abbiamo ricevuto la tua richiesta di preventivo per l'evento in data %s.
                Il nostro team provvederà a ricontattarti al più presto al numero %s o via email per proporre la migliore soluzione su misura per te.
                
                Cordiali saluti,
                Team Vinco Eventi
                +39 349 294 9669 | vincoeventi@gmail.com
                """,
                    quote.getNome(), quote.getCognome(),
                    dataEventoFormatted,
                    quote.getTelefono()
            );

            String htmlBody = String.format("""
                <!DOCTYPE html>
                <html lang="it">
                <head>
                  <meta charset="UTF-8">
                </head>
                <body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333; background-color: #f4f6f8; margin: 0; padding: 20px;">
                  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; padding: 25px;">
                    <h2 style="color: #0b3c26; margin-top: 0;">Gentile %s %s,</h2>
                    <p>Grazie per aver contattato <strong>VINCO EVENTI</strong>!</p>
                    <p>Abbiamo ricevuto la tua richiesta di preventivo per l'evento in data <strong>%s</strong>. Il nostro team provvederà a ricontattarti al più presto al numero <strong>%s</strong> o via email per proporti la migliore soluzione su misura per te.</p>
                    <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
                    <p style="margin-bottom: 0;">
                      Cordiali saluti,<br/>
                      <strong>Team Vinco Eventi</strong><br/>
                      📞 <a href="tel:+393492949669" style="color: #0b3c26; text-decoration: none;">+39 349 294 9669</a> | ✉️ <a href="mailto:vincoeventi@gmail.com" style="color: #0b3c26; text-decoration: none;">vincoeventi@gmail.com</a>
                    </p>
                  </div>
                </body>
                </html>
                """,
                    quote.getNome(), quote.getCognome(),
                    dataEventoFormatted,
                    quote.getTelefono()
            );

            helper.setText(plainText, htmlBody);
            mailSender.send(mimeMessage);
            System.out.println(">>> Email di conferma inviata con successo al cliente: " + quote.getEmail());
        } catch (Exception ex) {
            System.err.println("[ERROR EmailService] Impossibile inviare l'email al cliente: " + ex.getMessage());
        }
    }
}

