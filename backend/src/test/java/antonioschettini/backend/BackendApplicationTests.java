package antonioschettini.backend;

import antonioschettini.backend.recordsDTO.QuoteRequestDTO;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

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
                "Masseria Coccaro, Monopoli",
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
                .location("Masseria Coccaro, Monopoli")
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
                .location("Masseria Coccaro, Monopoli")
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
}

