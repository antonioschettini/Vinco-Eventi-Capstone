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
}

