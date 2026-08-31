package antonioschettini.backend;

import antonioschettini.backend.entities.QuoteRequest;
import antonioschettini.backend.services.WhatsAppNotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class WhatsAppNotificationServiceTest {

    private WhatsAppNotificationService service;

    @BeforeEach
    void setUp() {
        service = new WhatsAppNotificationService();
    }

    @Test
    void testSendQuoteNotificationDisabledDoesNothing() {
        ReflectionTestUtils.setField(service, "enabled", false);
        QuoteRequest quote = QuoteRequest.builder()
                .id(UUID.randomUUID())
                .nome("Mario")
                .cognome("Rossi")
                .dataEvento(LocalDate.now())
                .build();

        assertDoesNotThrow(() -> service.sendQuoteNotificationToAdmin(quote));
    }

    @Test
    void testSendQuoteNotificationNullQuoteDoesNothing() {
        ReflectionTestUtils.setField(service, "enabled", true);
        assertDoesNotThrow(() -> service.sendQuoteNotificationToAdmin(null));
    }

    @Test
    void testSendQuoteNotificationWithCallMeBotFailSafe() {
        ReflectionTestUtils.setField(service, "enabled", true);
        ReflectionTestUtils.setField(service, "adminPhone", "393496037722");
        ReflectionTestUtils.setField(service, "callMeBotApiKey", "dummyKey");
        ReflectionTestUtils.setField(service, "frontendBaseUrl", "https://vincoeventi.com");

        QuoteRequest quote = QuoteRequest.builder()
                .id(UUID.randomUUID())
                .nome("Mario")
                .cognome("Rossi")
                .telefono("+39 349 1234567")
                .email("mario.rossi@example.it")
                .dataEvento(LocalDate.of(2026, 9, 15))
                .tipoEvento("Matrimonio")
                .location("Villa de Grecis")
                .numeroOspiti("120")
                .budget("2.000€-3.500€")
                .messaggio("Vorrei info su Dj Set e Violinista")
                .build();

        // Non deve mai lanciare eccezioni bloccanti anche se l'endpoint di rete non è raggiungibile
        assertDoesNotThrow(() -> service.sendQuoteNotificationToAdmin(quote));
    }
}
