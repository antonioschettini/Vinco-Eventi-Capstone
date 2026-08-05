package antonioschettini.backend.services;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
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
     * Supporta l'autodetect per qualsiasi lingua (francese, inglese, tedesco, spagnolo, ecc.)
     * ed esegue la traduzione paragrafo per paragrafo per gestire testi con lingue miste.
     */
    public String translate(String text, String sourceLang, String targetLang) {
        if (text == null || text.isBlank()) {
            return "";
        }

        String src = (sourceLang != null && !sourceLang.isBlank()) ? sourceLang.toLowerCase().trim() : "autodetect";
        String tgt = (targetLang != null && !targetLang.isBlank()) ? targetLang.toLowerCase().trim() : "it";

        if (src.equalsIgnoreCase(tgt)) {
            return text;
        }

        try {
            // Separazione per righe/paragrafi per consentire l'autodetect dinamico su ciascuna porzione di testo
            String[] paragraphs = text.split("\r?\n");
            List<String> translatedParagraphs = new ArrayList<>();

            for (String para : paragraphs) {
                if (para.isBlank()) {
                    translatedParagraphs.add("");
                    continue;
                }
                String translatedPara = translateSingleChunk(para, src, tgt);
                translatedParagraphs.add(translatedPara);
            }

            return String.join("\n", translatedParagraphs);
        } catch (Exception e) {
            System.err.println("[WARN TranslationService] Errore durante la traduzione automatica: " + e.getMessage());
            return text;
        }
    }

    private String translateSingleChunk(String chunk, String src, String tgt) {
        if (chunk == null || chunk.isBlank()) {
            return "";
        }

        try {
            String pair = src + "|" + tgt;

            URI uri = UriComponentsBuilder
                    .fromUriString("https://api.mymemory.translated.net/get")
                    .queryParam("q", chunk)
                    .queryParam("langpair", pair)
                    .queryParam("de", "vincoeventi@gmail.com")
                    .build()
                    .toUri();

            String jsonResponse = restTemplate.getForObject(uri, String.class);
            if (jsonResponse != null) {
                Pattern pattern = Pattern.compile("\"translatedText\"\\s*:\\s*\"([^\"]+)\"");
                Matcher matcher = pattern.matcher(jsonResponse);
                if (matcher.find()) {
                    String translated = matcher.group(1);
                    if (translated != null && !translated.isBlank() && isValidTranslationResponse(translated)) {
                        String unescaped = unescapeJson(translated);
                        if (!unescaped.equalsIgnoreCase(chunk.trim())) {
                            return unescaped;
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("[WARN TranslationService] Errore durante la traduzione del chunk: " + e.getMessage());
        }

        return chunk;
    }

    private boolean isValidTranslationResponse(String translated) {
        String upper = translated.toUpperCase();
        return !upper.contains("PLEASE SELECT TWO DISTINCT LANGUAGES") &&
               !upper.contains("QUERY LENGTH LIMIT EXCEEDED") &&
               !upper.contains("INVALID LANGUAGE PAIR") &&
               !upper.contains("NO VALID PAIR FOUND") &&
               !upper.contains("IS NOT A VALID LANGUAGE") &&
               !upper.contains("MYMEMORY WARNING");
    }

    public boolean isLikelyForeign(String text) {
        if (text == null || text.isBlank()) return false;
        String lower = " " + text.toLowerCase().replaceAll("[^a-zàèéìòùáéíóúâêîôûäëïöüñ]", " ") + " ";

        String[] foreignKeywords = {
            // Francese
            "nous", "vous", "notre", "votre", "mariage", "musique", "pour", "avec", "cérémonie",
            "chaleureux", "morceaux", "aimerions", "souhaitions", "bonjour", "merci", "élégante", "festifs",
            // Inglese
            "the", "and", "would", "love", "wedding", "music", "feel", "joyful", "elegant", "modern",
            "prefer", "warm", "romantic", "party", "please", "let", "know", "equipment", "requirements",
            "setup", "venue", "happy", "favorite", "songs", "with", "from", "your", "have", "need",
            // Tedesco / Spagnolo
            "und", "mit", "für", "hochzeit", "musik", "para", "con", "boda", "fiesta", "gracias"
        };

        int count = 0;
        for (String word : foreignKeywords) {
            if (lower.contains(" " + word + " ")) {
                count++;
                if (count >= 2) return true;
            }
        }
        return false;
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
