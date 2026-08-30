package antonioschettini.backend;

import antonioschettini.backend.recordsDTO.QuoteRequestDTO;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class BackendApplicationTests {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void testValidQuoteDTO() {
        QuoteRequestDTO dto = new QuoteRequestDTO(
                "Mario",
                "Rossi",
                "mario.rossi@example.com",
                "+39 3331234567",
                LocalDate.now().plusDays(10),
                "Matrimonio",
                "Villa Belvedere, Monopoli",
                "120",
                "Pranzo",
                "Religioso",
                "Desideriamo musica dal vivo",
                "1.500€-3.000€",
                "it"
        );
        Set<ConstraintViolation<QuoteRequestDTO>> violations = validator.validate(dto);
        assertTrue(violations.isEmpty(), "Un DTO valido non deve generare violazioni di validazione");
    }

    @Test
    void testMaliciousNameWith1Equals1Rejected() {
        QuoteRequestDTO dto = new QuoteRequestDTO(
                "Francesco 1=1",
                "Cutrone",
                "francesco@example.com",
                "+39 3331234567",
                LocalDate.now().plusDays(10),
                "Matrimonio",
                "Corte Bracco, Corato",
                "100",
                "Pranzo",
                "Religioso",
                "Test",
                "1.500€-3.000€",
                "it"
        );
        Set<ConstraintViolation<QuoteRequestDTO>> violations = validator.validate(dto);
        assertFalse(violations.isEmpty(), "Il nome malevolo con '1=1' deve essere rifiutato");
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("nome")));
    }

    @Test
    void testMaliciousLocationWith1Equals1Rejected() {
        QuoteRequestDTO dto = new QuoteRequestDTO(
                "Francesco",
                "Cutrone",
                "francesco@example.com",
                "+39 3331234567",
                LocalDate.now().plusDays(10),
                "Matrimonio",
                "Corte, bracco dei Germani, 1=1",
                "100",
                "Pranzo",
                "Religioso",
                "Test",
                "1.500€-3.000€",
                "it"
        );
        Set<ConstraintViolation<QuoteRequestDTO>> violations = validator.validate(dto);
        assertFalse(violations.isEmpty(), "La location malevola con '1=1' deve essere rifiutata");
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("location")));
    }

    @Test
    void testEmailServiceClientConfirmationFormattingItalianAndEnglish() {
        antonioschettini.backend.services.EmailService emailService = new antonioschettini.backend.services.EmailService();
        // Set dummy brevo api key via reflection so it proceeds past the null check to format templates
        try {
            java.lang.reflect.Field field = antonioschettini.backend.services.EmailService.class.getDeclaredField("brevoApiKey");
            field.setAccessible(true);
            field.set(emailService, "dummy-test-key");
        } catch (Exception e) {
            fail("Reflection error: " + e.getMessage());
        }

        antonioschettini.backend.entities.QuoteRequest quoteIt = antonioschettini.backend.entities.QuoteRequest.builder()
                .id(java.util.UUID.randomUUID())
                .nome("Mario")
                .cognome("Rossi")
                .email("mario.rossi@example.com")
                .telefono("+39 3331234567")
                .dataEvento(LocalDate.now().plusDays(30))
                .tipoEvento("Matrimonio")
                .location("Villa Belvedere, Monopoli")
                .numeroOspiti("120")
                .budget("1.500€-3.000€")
                .lingua("it")
                .build();

        antonioschettini.backend.entities.QuoteRequest quoteEn = antonioschettini.backend.entities.QuoteRequest.builder()
                .id(java.util.UUID.randomUUID())
                .nome("John")
                .cognome("Doe")
                .email("john.doe@example.com")
                .telefono("+1 555123456")
                .dataEvento(LocalDate.now().plusDays(30))
                .tipoEvento("Wedding")
                .location("Villa Belvedere, Monopoli")
                .numeroOspiti("100")
                .budget("3.000€-5.000€")
                .lingua("en")
                .build();

        // Redirect System.err to capture any log errors
        java.io.ByteArrayOutputStream errStream = new java.io.ByteArrayOutputStream();
        java.io.PrintStream originalErr = System.err;
        try {
            System.setErr(new java.io.PrintStream(errStream));

            emailService.sendConfirmationEmailToClient(quoteIt);
            emailService.sendConfirmationEmailToClient(quoteEn);
            emailService.sendQuoteNotificationEmail(quoteIt);

            String errLog = errStream.toString();
            assertFalse(errLog.contains("Conversion = ';'"), "L'invio email non deve generare eccezioni Conversion = ';'");
            assertFalse(errLog.contains("[ERROR EmailService]"), "Non ci devono essere errori di formattazione in EmailService");
        } finally {
            System.setErr(originalErr);
        }
    }

    @Test
    void testTranslationServiceEnglishToItalian() {
        antonioschettini.backend.services.TranslationService translationService = new antonioschettini.backend.services.TranslationService();
        String englishText = "We would like to book a DJ set for our wedding in September.";
        String translated = translationService.translate(englishText, "autodetect", "it");

        assertNotNull(translated);
        assertFalse(translated.isBlank());
        assertNotEquals(englishText.trim().toLowerCase(), translated.trim().toLowerCase(), "La traduzione di un testo inglese in italiano non deve restituire il testo originale");
        assertTrue(translated.toLowerCase().contains("dj") || translated.toLowerCase().contains("matrimonio") || translated.toLowerCase().contains("settembre"), "La traduzione in italiano deve contenere le parole chiave tradotte");
    }

    @Test
    void testTranslationServiceFrenchToItalian() {
        antonioschettini.backend.services.TranslationService translationService = new antonioschettini.backend.services.TranslationService();
        String frenchText = "Nous aimerions réserver un DJ pour notre mariage.";
        String translated = translationService.translate(frenchText, "autodetect", "it");

        assertNotNull(translated);
        assertFalse(translated.isBlank());
        assertNotEquals(frenchText.trim().toLowerCase(), translated.trim().toLowerCase(), "La traduzione dal francese all'italiano deve avvenire con successo");
    }

    @Test
    void testTranslationServiceItalianTextReturnsOriginalWithoutError() {
        antonioschettini.backend.services.TranslationService translationService = new antonioschettini.backend.services.TranslationService();
        String italianText = "Vorrei un preventivo per un matrimonio a settembre a Monopoli.";
        String translated = translationService.translate(italianText, "autodetect", "it");

        assertNotNull(translated);
        assertEquals(italianText.trim(), translated.trim(), "Per un testo già in italiano, la traduzione deve restituire il testo originale senza errori o modifiche");
    }

    @Test
    void testTranslationServiceNullOrEmpty() {
        antonioschettini.backend.services.TranslationService translationService = new antonioschettini.backend.services.TranslationService();
        assertEquals("", translationService.translate(null, "autodetect", "it"));
        assertEquals("", translationService.translate("", "autodetect", "it"));
        assertEquals("", translationService.translate("   ", "autodetect", "it"));
    }

    @Test
    void testTranslationServiceWithQuotesAndMultiline() {
        antonioschettini.backend.services.TranslationService translationService = new antonioschettini.backend.services.TranslationService();
        String textWithQuotes = "Hello! We want a \"special\" wedding party.\nWe love live music & DJ performance.";
        String translated = translationService.translate(textWithQuotes, "autodetect", "it");

        assertNotNull(translated);
        assertFalse(translated.isBlank());
        assertTrue(translated.contains("\n"), "La traduzione di un testo multilinea deve preservare i ritorni a capo");
        assertFalse(translated.contains("&quot;"), "La traduzione non deve contenere entità HTML unescaped come &quot;");
        assertFalse(translated.contains("&#39;"), "La traduzione non deve contenere entità HTML unescaped come &#39;");
        assertFalse(translated.contains("&amp;"), "La traduzione non deve contenere entità HTML unescaped come &amp;");
    }
}

