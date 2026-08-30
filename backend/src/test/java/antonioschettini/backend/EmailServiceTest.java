package antonioschettini.backend;

import antonioschettini.backend.entities.QuoteRequest;
import antonioschettini.backend.enums.QuoteStatus;
import antonioschettini.backend.services.EmailService;
import antonioschettini.backend.services.TranslationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private TranslationService translationService;

    @InjectMocks
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "backendBaseUrl", "http://localhost:8080");
        ReflectionTestUtils.setField(emailService, "frontendBaseUrl", "http://localhost:5173");
        ReflectionTestUtils.setField(emailService, "mailFrom", "vincoeventi@gmail.com");
        ReflectionTestUtils.setField(emailService, "brevoApiKey", "");
        lenient().when(mailSender.createMimeMessage()).thenReturn(new MimeMessage((Session) null));
    }

    @Test
    void testSendQuoteNotificationEmailNullQuoteGracefullyHandled() {
        assertDoesNotThrow(() -> emailService.sendQuoteNotificationEmail(null));
        verifyNoInteractions(mailSender);
    }

    @Test
    void testSendQuoteNotificationEmailTranslatesForeignMessage() {
        QuoteRequest quote = QuoteRequest.builder()
                .id(UUID.randomUUID())
                .nome("John")
                .cognome("Smith")
                .email("john.smith@example.com")
                .telefono("+123456789")
                .dataEvento(LocalDate.of(2026, 9, 20))
                .dataRichiesta(LocalDateTime.now())
                .tipoEvento("Wedding")
                .location("Masseria San Domenico")
                .numeroOspiti("120")
                .orarioGiornata("Dinner")
                .budget("3.000€-5.000€")
                .lingua("en")
                .messaggio("We would love a live sax performance and evening DJ set.")
                .stato(QuoteStatus.PENDING)
                .build();

        when(translationService.translate(anyString(), eq("autodetect"), eq("it")))
                .thenReturn("Vorremmo un'esibizione con sax dal vivo e DJ set serale.");

        assertDoesNotThrow(() -> emailService.sendQuoteNotificationEmail(quote));
        verify(translationService, times(1)).translate(eq(quote.getMessaggio()), eq("autodetect"), eq("it"));
    }

    @Test
    void testSendUserQuoteConfirmationEmailItalianCustomer() {
        QuoteRequest quote = QuoteRequest.builder()
                .id(UUID.randomUUID())
                .nome("Marco")
                .cognome("Rossi")
                .email("marco.rossi@example.it")
                .telefono("+39 340 1234567")
                .dataEvento(LocalDate.of(2026, 7, 15))
                .dataRichiesta(LocalDateTime.now())
                .tipoEvento("Matrimonio")
                .location("Bari")
                .numeroOspiti("100")
                .orarioGiornata("Pranzo")
                .budget("1.500€-3.000€")
                .lingua("it")
                .messaggio("Musica per cerimonia e pranzo.")
                .stato(QuoteStatus.PENDING)
                .build();

        assertDoesNotThrow(() -> emailService.sendConfirmationEmailToClient(quote));
    }
}
