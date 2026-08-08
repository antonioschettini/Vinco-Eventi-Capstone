package antonioschettini.backend;

import antonioschettini.backend.services.TranslationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TranslationServiceTest {

    private TranslationService translationService;

    @BeforeEach
    void setUp() {
        translationService = new TranslationService();
    }

    @Test
    void testTranslateEnglishToItalian() {
        String input = "We would like to request a quote for a wedding DJ performance.";
        String translated = translationService.translate(input, "autodetect", "it");

        assertNotNull(translated);
        assertFalse(translated.isBlank());
        assertFalse(translated.contains("ã"), "La traduzione non deve contenere caratteri UTF-8 corrotti come 'ã'");
        assertTrue(translated.toLowerCase().contains("preventivo") || translated.toLowerCase().contains("matrimonio") || translated.toLowerCase().contains("dj"),
                "La traduzione in italiano deve contenere parole chiave rilevanti");
    }

    @Test
    void testTranslateMultilingualJapaneseAndGermanWithoutCorruption() {
        String input = "Dies ist ein Blindtext. Er dient dazu, das Layout und das Design der Seite zu überprüfen.\n" +
                "Info aggiuntive: これはダミーテキストです。レイアウトやデザインを確認するために使用されています。";

        String translated = translationService.translate(input, "autodetect", "it");

        assertNotNull(translated);
        assertFalse(translated.isBlank());
        assertFalse(translated.contains("ã・・"), "La traduzione di testi giapponesi e tedeschi non deve produrre stringhe corrotte tipo 'ã・・'");
        assertTrue(translated.toLowerCase().contains("testo") || translated.toLowerCase().contains("layout") || translated.toLowerCase().contains("design"),
                "La traduzione deve contenere il testo tradotto in italiano in UTF-8 valido");
    }

    @Test
    void testIsLikelyForeignDetection() {
        // Giapponese
        assertTrue(translationService.isLikelyForeign("これはダミーテキストです"));
        // Cirillico
        assertTrue(translationService.isLikelyForeign("Это тестовый текст для свадьбы"));
        // Inglese
        assertTrue(translationService.isLikelyForeign("We would love a modern DJ set for our wedding party"));
        // Francese
        assertTrue(translationService.isLikelyForeign("Nous aimerions réserver une musique pour notre mariage"));
        // Italiano
        assertFalse(translationService.isLikelyForeign("Vorrei informazioni sui vostri servizi per un matrimonio a Bari"));
    }

    @Test
    void testTranslateSameLanguageReturnsOriginalText() {
        String italianText = "Musica dal vivo ed intagliatore di luci per matrimoni ed eventi.";
        String result = translationService.translate(italianText, "it", "it");
        assertEquals(italianText, result);
    }

    @Test
    void testTranslateNullOrEmpty() {
        assertEquals("", translationService.translate(null, "auto", "it"));
        assertEquals("", translationService.translate("", "auto", "it"));
        assertEquals("", translationService.translate("   ", "auto", "it"));
    }
}
