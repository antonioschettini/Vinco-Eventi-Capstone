package antonioschettini.backend.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Servizio di Traduzione Multilingua Ottimizzato.
 * Supporta autodetect per qualsiasi lingua (Giapponese, Cinese, Russo, Tedesco, Francese, Inglese, Spagnolo, ecc.).
 * Utilizza un decoding rigorosamente in UTF-8 sui byte array di risposta per prevenire ogni problema di
 * alterazione dei caratteri (es. 'ã・・・・') e decodifica le entità HTML.
 */
@Service
public class TranslationService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public TranslationService() {
        this.restTemplate = new RestTemplate();
        // Configura il convertitore di messaggi per usare UTF-8 in modo nativo
        this.restTemplate.getMessageConverters().removeIf(c -> c instanceof StringHttpMessageConverter);
        this.restTemplate.getMessageConverters().add(0, new StringHttpMessageConverter(StandardCharsets.UTF_8));
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Traduce il testo da una lingua di origine a una di destinazione.
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
            // Separazione per righe/paragrafi per conservare la formattazione e tradurre correttamente testi multilinea
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

        // 1. Motore Primario: Google Translate GTX (supporto eccellente multilingua e autodetect per frase)
        String gtxResult = translateSingleChunkGtx(chunk, src, tgt);
        if (gtxResult != null && !gtxResult.isBlank()) {
            return gtxResult;
        }

        // 2. Motore di Fallback: MyMemory API
        return translateSingleChunkMyMemory(chunk, src, tgt);
    }

    private String translateSingleChunkGtx(String chunk, String src, String tgt) {
        try {
            String sl = (src == null || src.isBlank() || src.equalsIgnoreCase("autodetect")) ? "auto" : src.toLowerCase().trim();
            String tl = (tgt == null || tgt.isBlank()) ? "it" : tgt.toLowerCase().trim();

            URI uri = UriComponentsBuilder
                    .fromUriString("https://translate.googleapis.com/translate_a/single")
                    .queryParam("client", "gtx")
                    .queryParam("sl", sl)
                    .queryParam("tl", tl)
                    .queryParam("dt", "t")
                    .queryParam("q", chunk)
                    .build()
                    .encode(StandardCharsets.UTF_8)
                    .toUri();

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            headers.set("Accept-Charset", "UTF-8");
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<byte[]> response = restTemplate.exchange(uri, HttpMethod.GET, entity, byte[].class);
            if (response.getBody() != null && response.getBody().length > 0) {
                String jsonResponse = new String(response.getBody(), StandardCharsets.UTF_8);
                JsonNode rootNode = objectMapper.readTree(jsonResponse);
                JsonNode sentences = rootNode.path(0);
                if (sentences.isArray() && sentences.size() > 0) {
                    StringBuilder sb = new StringBuilder();
                    for (JsonNode sentence : sentences) {
                        if (sentence.isArray() && sentence.size() > 0) {
                            sb.append(sentence.get(0).asText(""));
                        }
                    }
                    String translated = sb.toString();
                    if (!translated.isBlank()) {
                        return cleanTranslation(translated);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("[WARN TranslationService] Errore motore primario GTX: " + e.getMessage());
        }
        return null;
    }

    private String translateSingleChunkMyMemory(String chunk, String src, String tgt) {
        try {
            String pair = (src == null || src.equalsIgnoreCase("autodetect") ? "autodetect" : src) + "|" + tgt;

            URI uri = UriComponentsBuilder
                    .fromUriString("https://api.mymemory.translated.net/get")
                    .queryParam("q", chunk)
                    .queryParam("langpair", pair)
                    .queryParam("de", "vincoeventi@gmail.com")
                    .build()
                    .encode(StandardCharsets.UTF_8)
                    .toUri();

            HttpHeaders headers = new HttpHeaders();
            headers.set("Accept-Charset", "UTF-8");
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<byte[]> response = restTemplate.exchange(uri, HttpMethod.GET, entity, byte[].class);
            if (response.getBody() != null && response.getBody().length > 0) {
                String jsonResponse = new String(response.getBody(), StandardCharsets.UTF_8);
                JsonNode rootNode = objectMapper.readTree(jsonResponse);
                JsonNode responseData = rootNode.path("responseData");
                String translated = responseData.path("translatedText").asText("");

                if (!translated.isBlank() && isValidTranslationResponse(translated)) {
                    String clean = cleanTranslation(translated);
                    if (!clean.equalsIgnoreCase(chunk.trim())) {
                        return clean;
                    }
                }
            }
        } catch (HttpClientErrorException e) {
            String body = e.getResponseBodyAsString();
            if (body != null && body.toUpperCase().contains("PLEASE SELECT TWO DISTINCT LANGUAGES")) {
                return chunk;
            }
            System.err.println("[WARN TranslationService] Errore HTTP MyMemory API (" + e.getStatusCode() + "): " + e.getMessage());
        } catch (Exception e) {
            System.err.println("[WARN TranslationService] Errore durante la traduzione MyMemory: " + e.getMessage());
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

    /**
     * Riconosce se un testo contiene caratteri o parole straniere (Inglese, Francese, Giapponese, Cinese, Russo, ecc.).
     */
    public boolean isLikelyForeign(String text) {
        if (text == null || text.isBlank()) return false;

        // 1. Rilevamento immediato di alfabeti non latini (Giapponese, Cinese, Cirillico, Arabo, Greco)
        for (char c : text.toCharArray()) {
            Character.UnicodeBlock block = Character.UnicodeBlock.of(c);
            if (block == Character.UnicodeBlock.HIRAGANA ||
                block == Character.UnicodeBlock.KATAKANA ||
                block == Character.UnicodeBlock.CJK_UNIFIED_IDEOGRAPHS ||
                block == Character.UnicodeBlock.CYRILLIC ||
                block == Character.UnicodeBlock.ARABIC ||
                block == Character.UnicodeBlock.GREEK) {
                return true;
            }
        }

        // 2. Rilevamento parole chiave straniere in alfabeto latino
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
            "und", "mit", "für", "hochzeit", "musik", "para", "con", "boda", "fiesta", "gracias", "dies", "ist", "ein"
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

    private String cleanTranslation(String input) {
        if (input == null) return "";
        return input.replace("&quot;", "\"")
                    .replace("&#39;", "'")
                    .replace("&#039;", "'")
                    .replace("&amp;", "&")
                    .replace("&lt;", "<")
                    .replace("&gt;", ">")
                    .replace("&deg;", "°")
                    .replace("&nbsp;", " ")
                    .replace("\\u0027", "'")
                    .replace("\\u0026", "&");
    }

    public String translateItToEn(String text) {
        return translate(text, "it", "en");
    }

    public String translateEnToIt(String text) {
        return translate(text, "en", "it");
    }
}
