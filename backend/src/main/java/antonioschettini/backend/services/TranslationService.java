package antonioschettini.backend.services;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class TranslationService {

    private final RestTemplate restTemplate;

    public TranslationService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Traduce il testo da una lingua di origine a una di destinazione.
     * Es: "it" -> "en" oppure "en" -> "it".
     * In caso di errore o assenza di connessione, restituisce il testo originale in modo sicuro.
     */
    public String translate(String text, String sourceLang, String targetLang) {
        if (text == null || text.isBlank()) {
            return "";
        }

        try {
            String src = (sourceLang != null && !sourceLang.isBlank()) ? sourceLang.toLowerCase() : "it";
            String tgt = (targetLang != null && !targetLang.isBlank()) ? targetLang.toLowerCase() : "en";

            if (src.equalsIgnoreCase(tgt)) {
                tgt = src.equalsIgnoreCase("it") ? "en" : "it";
            }

            String pair = src + "|" + tgt;

            URI uri = UriComponentsBuilder
                    .fromUriString("https://api.mymemory.translated.net/get")
                    .queryParam("q", text)
                    .queryParam("langpair", pair)
                    .build()
                    .toUri();

            String jsonResponse = restTemplate.getForObject(uri, String.class);
            if (jsonResponse != null) {
                Pattern pattern = Pattern.compile("\"translatedText\"\\s*:\\s*\"([^\"]+)\"");
                Matcher matcher = pattern.matcher(jsonResponse);
                if (matcher.find()) {
                    String translated = matcher.group(1);
                    if (translated != null && !translated.isBlank() && !translated.equalsIgnoreCase("QUERY LENGTH LIMIT EXCEEDED")) {
                        return unescapeJson(translated);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("[WARN TranslationService] Errore durante la traduzione automatica: " + e.getMessage());
        }

        return text;
    }

    private String unescapeJson(String input) {
        if (input == null) return "";
        String unescaped = input.replace("\\\"", "\"")
                                .replace("\\n", "\n")
                                .replace("\\r", "\r")
                                .replace("\\t", "\t")
                                .replace("\\/", "/");

        Matcher matcher = Pattern.compile("\\\\u([0-9a-fA-F]{4})").matcher(unescaped);
        StringBuilder sb = new StringBuilder();
        while (matcher.find()) {
            int codePoint = Integer.parseInt(matcher.group(1), 16);
            matcher.appendReplacement(sb, Matcher.quoteReplacement(Character.toString(codePoint)));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    public String translateItToEn(String text) {
        return translate(text, "it", "en");
    }

    public String translateEnToIt(String text) {
        return translate(text, "en", "it");
    }
}
