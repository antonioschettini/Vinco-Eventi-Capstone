package antonioschettini.backend.services;

import antonioschettini.backend.entities.QuoteRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.format.DateTimeFormatter;

@Service
public class WhatsAppNotificationService {

    @Value("${whatsapp.notification.enabled:false}")
    private boolean enabled;

    @Value("${whatsapp.admin.phone:}")
    private String adminPhone;

    @Value("${whatsapp.callmebot.apikey:}")
    private String callMeBotApiKey;

    @Value("${whatsapp.webhook.url:}")
    private String webhookUrl;

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(6))
            .build();

    @Async
    public void sendQuoteNotificationToAdmin(QuoteRequest quote) {
        if (!enabled || quote == null) {
            return;
        }

        try {
            String messageText = buildNotificationMessage(quote);

            // 1. Invio tramite Webhook generico (se configurato - supporta n8n, Make, Meta API o Gateway Custom)
            if (webhookUrl != null && !webhookUrl.isBlank()) {
                sendGenericWebhook(quote, messageText);
            }

            // 2. Invio tramite Gateway Istantaneo CallMeBot per WhatsApp (se configurata API Key e Telefono Admin)
            if (callMeBotApiKey != null && !callMeBotApiKey.isBlank() && adminPhone != null && !adminPhone.isBlank()) {
                sendCallMeBotWhatsApp(adminPhone, messageText, callMeBotApiKey);
            }

        } catch (Exception ex) {
            System.err.println("[WARN WhatsAppNotificationService] Impossibile inviare la notifica WhatsApp all'admin: " + ex.getMessage());
        }
    }

    private String buildNotificationMessage(QuoteRequest quote) {
        String dataEventoFormatted = quote.getDataEvento() != null
                ? quote.getDataEvento().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : "Non specificata";

        StringBuilder sb = new StringBuilder();
        sb.append("🔔 *VINCO EVENTI - NUOVO PREVENTIVO!* 🔔\n\n");
        sb.append("👤 *Cliente:* ").append(quote.getNome()).append(" ").append(quote.getCognome()).append("\n");
        sb.append("📅 *Data Evento:* ").append(dataEventoFormatted).append("\n");
        sb.append("🎉 *Tipo Evento:* ").append(quote.getTipoEvento() != null ? quote.getTipoEvento() : "Matrimonio").append("\n");

        if (quote.getLocation() != null && !quote.getLocation().isBlank()) {
            sb.append("📍 *Location:* ").append(quote.getLocation()).append("\n");
        }
        if (quote.getTelefono() != null && !quote.getTelefono().isBlank()) {
            sb.append("📞 *Telefono:* ").append(quote.getTelefono()).append("\n");
        }
        if (quote.getEmail() != null && !quote.getEmail().isBlank()) {
            sb.append("✉️ *Email:* ").append(quote.getEmail()).append("\n");
        }
        if (quote.getNumeroOspiti() != null && !quote.getNumeroOspiti().isBlank()) {
            sb.append("👥 *Ospiti:* ").append(quote.getNumeroOspiti()).append("\n");
        }
        if (quote.getBudget() != null && !quote.getBudget().isBlank()) {
            sb.append("💰 *Budget:* ").append(quote.getBudget()).append("\n");
        }
        if (quote.getMessaggio() != null && !quote.getMessaggio().isBlank() && !quote.getMessaggio().equals("-")) {
            String shortMsg = quote.getMessaggio().length() > 200 
                    ? quote.getMessaggio().substring(0, 197) + "..." 
                    : quote.getMessaggio();
            sb.append("💬 *Nota:* \"").append(shortMsg).append("\"\n");
        }

        sb.append("\n👉 *Accedi alla Dashboard:* ").append(frontendBaseUrl).append("/admin");
        return sb.toString();
    }

    private void sendCallMeBotWhatsApp(String phone, String text, String apiKey) {
        try {
            String cleanPhone = phone.replaceAll("[^\\d]", "");
            String encodedText = URLEncoder.encode(text, StandardCharsets.UTF_8);
            String url = String.format("https://api.callmebot.com/whatsapp.php?phone=%s&text=%s&apikey=%s", cleanPhone, encodedText, apiKey.trim());

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(8))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                System.out.println(">>> Notifica WhatsApp inviata con successo all'admin via CallMeBot gateway!");
            } else {
                System.err.println("[WARN WhatsAppNotificationService] Gateway CallMeBot ha risposto con status code: " + response.statusCode());
            }
        } catch (Exception ex) {
            System.err.println("[WARN WhatsAppNotificationService] Errore durante la chiamata CallMeBot: " + ex.getMessage());
        }
    }

    private void sendGenericWebhook(QuoteRequest quote, String messageText) {
        try {
            String jsonPayload = String.format(
                    "{\"text\":%s,\"quoteId\":\"%s\",\"cliente\":\"%s %s\",\"tipoEvento\":\"%s\",\"dataEvento\":\"%s\"}",
                    escapeJson(messageText),
                    quote.getId() != null ? quote.getId().toString() : "",
                    escapeJsonValue(quote.getNome()),
                    escapeJsonValue(quote.getCognome()),
                    escapeJsonValue(quote.getTipoEvento()),
                    quote.getDataEvento() != null ? quote.getDataEvento().toString() : ""
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(webhookUrl))
                    .timeout(Duration.ofSeconds(6))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                System.out.println(">>> Notifica Webhook inviata con successo all'endpoint configurato!");
            } else {
                System.err.println("[WARN WhatsAppNotificationService] Webhook ha risposto con status code: " + response.statusCode());
            }
        } catch (Exception ex) {
            System.err.println("[WARN WhatsAppNotificationService] Errore durante l'invio al Webhook: " + ex.getMessage());
        }
    }

    private String escapeJson(String input) {
        if (input == null) return "\"\"";
        return "\"" + input.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t") + "\"";
    }

    private String escapeJsonValue(String input) {
        if (input == null) return "";
        return input.replace("\"", "\\\"").replace("\n", " ").trim();
    }
}
