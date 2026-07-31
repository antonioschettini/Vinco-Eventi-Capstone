package antonioschettini.backend.services;

import antonioschettini.backend.entities.QuoteRequest;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendQuoteNotificationEmail(QuoteRequest quote) {
        if (mailSender == null) {
            System.out.println("[WARN EmailService] JavaMailSender non configurato. Salto l'invio email.");
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo("vincoeventi@gmail.com");
            helper.setSubject("🔔 Nuova Richiesta Preventivo - " + quote.getNome() + " " + quote.getCognome());

            String htmlBody = String.format("""
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #0b3c26;">Nuova Richiesta di Preventivo Ricevuta</h2>
                    <p>Hai ricevuto una nuova richiesta dal form del sito Vinco Eventi:</p>
                    <table style="width: 100%%; border-collapse: collapse; margin-top: 15px;">
                        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Nome e Cognome:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">%s %s</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Email:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">%s</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Telefono:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">%s</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Data Evento:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">%s</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Tipo Evento:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">%s</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Location:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">%s</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Numero Ospiti:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">%s</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Orario:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">%s</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Cerimonia:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">%s</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Budget:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">%s</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Messaggio:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">%s</td></tr>
                    </table>
                    <p style="margin-top: 20px; font-size: 12px; color: #777;">Email automatica generata dal sistema Vinco Eventi.</p>
                </div>
                """,
                    quote.getNome(), quote.getCognome(),
                    quote.getEmail(), quote.getTelefono(),
                    quote.getDataEvento() != null ? quote.getDataEvento().toString() : "Non specificata",
                    quote.getTipoEvento() != null ? quote.getTipoEvento() : "Non specificato",
                    quote.getLocation() != null ? quote.getLocation() : "Non specificata",
                    quote.getNumeroOspiti() != null ? quote.getNumeroOspiti() : "Non specificato",
                    quote.getOrarioGiornata() != null ? quote.getOrarioGiornata() : "Non specificato",
                    quote.getTipoCerimonia() != null ? quote.getTipoCerimonia() : "Non specificato",
                    quote.getBudget() != null ? quote.getBudget() : "Non specificato",
                    quote.getMessaggio() != null ? quote.getMessaggio() : "-"
            );

            helper.setText(htmlBody, true);
            mailSender.send(mimeMessage);
            System.out.println(">>> Email di notifica preventivo inviata a vincoeventi@gmail.com!");
        } catch (Exception ex) {
            System.err.println("[ERROR EmailService] Impossibile inviare l'email di notifica: " + ex.getMessage());
        }
    }

    public void sendConfirmationEmailToClient(QuoteRequest quote) {
        if (mailSender == null || quote.getEmail() == null || quote.getEmail().isBlank()) {
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo(quote.getEmail());
            helper.setSubject("Vinco Eventi - Conferma Ricezione Richiesta Preventivo");

            String htmlBody = String.format("""
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #0b3c26;">Gentile %s %s,</h2>
                    <p>Grazie per aver contattato <strong>VINCO EVENTI</strong>!</p>
                    <p>Abbiamo ricevuto la tua richiesta di preventivo per l'evento in data <strong>%s</strong>. Il nostro team provvederà a ricontattarti al più presto al numero <strong>%s</strong> o via email per proporre la migliore soluzione su misura per te.</p>
                    <br/>
                    <p>Cordiali saluti,<br/><strong>Team Vinco Eventi</strong><br/>+39 349 294 9669 | vincoeventi@gmail.com</p>
                </div>
                """,
                    quote.getNome(), quote.getCognome(),
                    quote.getDataEvento() != null ? quote.getDataEvento().toString() : "da definire",
                    quote.getTelefono()
            );

            helper.setText(htmlBody, true);
            mailSender.send(mimeMessage);
            System.out.println(">>> Email di conferma inviata al cliente: " + quote.getEmail());
        } catch (Exception ex) {
            System.err.println("[ERROR EmailService] Impossibile inviare l'email al cliente: " + ex.getMessage());
        }
    }
}
