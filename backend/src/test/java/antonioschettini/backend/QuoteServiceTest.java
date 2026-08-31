package antonioschettini.backend;

import antonioschettini.backend.entities.QuoteRequest;
import antonioschettini.backend.enums.QuoteStatus;
import antonioschettini.backend.exceptions.NotFoundException;
import antonioschettini.backend.recordsDTO.QuoteRequestDTO;
import antonioschettini.backend.repositories.QuoteRequestRepository;
import antonioschettini.backend.services.AccountingService;
import antonioschettini.backend.services.EmailService;
import antonioschettini.backend.services.QuoteService;
import antonioschettini.backend.services.WhatsAppNotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class QuoteServiceTest {

    @Mock
    private QuoteRequestRepository quoteRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private WhatsAppNotificationService whatsAppNotificationService;

    @Mock
    private AccountingService accountingService;

    @InjectMocks
    private QuoteService quoteService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testCreateQuoteSanitizesXssAndTriggersEmail() {
        QuoteRequestDTO dto = new QuoteRequestDTO(
                "<b>Mario</b>",
                "Rossi",
                "MARIO.ROSSI@GMAIL.COM ",
                "+39 3331234567",
                LocalDate.of(2026, 9, 15),
                "Matrimonio",
                "Villa Eventi",
                "150",
                "Sera",
                "Simbolica",
                "<i>Musica ed intrattenimento</i>",
                "1.500€-3.000€",
                "it"
        );

        when(quoteRepository.save(any(QuoteRequest.class))).thenAnswer(inv -> {
            QuoteRequest q = inv.getArgument(0);
            q.setId(UUID.randomUUID());
            return q;
        });

        QuoteRequest result = quoteService.createQuote(dto);

        assertNotNull(result);
        assertEquals("Mario", result.getNome());
        assertEquals("mario.rossi@gmail.com", result.getEmail());
        assertEquals("Musica ed intrattenimento", result.getMessaggio());
        assertEquals(QuoteStatus.PENDING, result.getStato());

        verify(emailService).sendQuoteNotificationEmail(any(QuoteRequest.class));
        verify(emailService).sendConfirmationEmailToClient(any(QuoteRequest.class));
        verify(whatsAppNotificationService).sendQuoteNotificationToAdmin(any(QuoteRequest.class));
    }

    @Test
    void testGetQuoteByIdNotFoundThrowsException() {
        UUID id = UUID.randomUUID();
        when(quoteRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> quoteService.getQuoteById(id));
    }

    @Test
    void testUpdateQuoteStatusToProcessedTriggersAccounting() {
        UUID id = UUID.randomUUID();
        QuoteRequest existing = QuoteRequest.builder()
                .id(id)
                .nome("Mario")
                .cognome("Rossi")
                .stato(QuoteStatus.PENDING)
                .build();

        when(quoteRepository.findById(id)).thenReturn(Optional.of(existing));
        when(quoteRepository.save(any(QuoteRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        QuoteRequest updated = quoteService.updateQuoteStatus(id, QuoteStatus.PROCESSED);

        assertEquals(QuoteStatus.PROCESSED, updated.getStato());
        verify(accountingService).createOrLinkEventFromQuote(updated);
    }

    @Test
    void testUpdateQuoteStatusFromProcessedToPendingUnlinksAccounting() {
        UUID id = UUID.randomUUID();
        QuoteRequest existing = QuoteRequest.builder()
                .id(id)
                .nome("Mario")
                .cognome("Rossi")
                .stato(QuoteStatus.PROCESSED)
                .build();

        when(quoteRepository.findById(id)).thenReturn(Optional.of(existing));
        when(quoteRepository.save(any(QuoteRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        QuoteRequest updated = quoteService.updateQuoteStatus(id, QuoteStatus.PENDING);

        assertEquals(QuoteStatus.PENDING, updated.getStato());
        verify(accountingService).unlinkOrDeleteByQuoteId(id);
    }

    @Test
    void testDeleteQuoteProcessedUnlinksAccounting() {
        UUID id = UUID.randomUUID();
        QuoteRequest existing = QuoteRequest.builder()
                .id(id)
                .stato(QuoteStatus.PROCESSED)
                .build();

        when(quoteRepository.findById(id)).thenReturn(Optional.of(existing));

        quoteService.deleteQuote(id);

        verify(accountingService).unlinkOrDeleteByQuoteId(id);
        verify(quoteRepository).delete(existing);
    }

    @Test
    void testGenerateIcsContentValid() {
        UUID id = UUID.randomUUID();
        QuoteRequest quote = QuoteRequest.builder()
                .id(id)
                .nome("Luca")
                .cognome("Bianchi")
                .email("luca@test.com")
                .dataEvento(LocalDate.of(2026, 8, 20))
                .tipoEvento("Festa di Laurea")
                .location("Napoli")
                .messaggio("Richiesta info audio e luci")
                .build();

        when(quoteRepository.findById(id)).thenReturn(Optional.of(quote));

        String ics = quoteService.generateIcsContent(id);

        assertNotNull(ics);
        assertTrue(ics.contains("BEGIN:VCALENDAR"));
        assertTrue(ics.contains("SUMMARY:Evento VINCO EVENTI - Luca Bianchi"));
        assertTrue(ics.contains("DTSTART;VALUE=DATE:20260820"));
        assertTrue(ics.contains("DTEND;VALUE=DATE:20260821"));
        assertTrue(ics.contains("END:VCALENDAR"));
    }

    @Test
    void testCreateQuotePreservesMultilineNewlines() {
        QuoteRequestDTO dto = new QuoteRequestDTO(
                "Giuseppe",
                "Verdi",
                "giuseppe.verdi@test.it",
                "+39 3491234567",
                LocalDate.of(2026, 10, 12),
                "Festa Privata",
                "Bari",
                "80",
                "Cena",
                "",
                "Raccontaci la tua idea di festa: Musica live e sax all'aperitivo\n\nInfo aggiuntive: Location fronte mare con giardino",
                "3.000€-5.000€",
                "it"
        );

        when(quoteRepository.save(any(QuoteRequest.class))).thenAnswer(inv -> {
            QuoteRequest q = inv.getArgument(0);
            q.setId(UUID.randomUUID());
            return q;
        });

        QuoteRequest result = quoteService.createQuote(dto);

        assertNotNull(result);
        assertEquals("Raccontaci la tua idea di festa: Musica live e sax all'aperitivo\n\nInfo aggiuntive: Location fronte mare con giardino", result.getMessaggio());
    }

    @Test
    void testCreateQuoteWithSingleFieldMessage() {
        QuoteRequestDTO dto = new QuoteRequestDTO(
                "Anna",
                "Neri",
                "anna.neri@test.it",
                "+39 3497654321",
                LocalDate.of(2026, 11, 5),
                "Compleanno",
                "Monopoli",
                "50",
                "Pranzo",
                "",
                "Raccontaci la tua idea di festa: DJ set e luci architetturali",
                "1.500€-3.000€",
                "it"
        );

        when(quoteRepository.save(any(QuoteRequest.class))).thenAnswer(inv -> {
            QuoteRequest q = inv.getArgument(0);
            q.setId(UUID.randomUUID());
            return q;
        });

        QuoteRequest result = quoteService.createQuote(dto);

        assertNotNull(result);
        assertEquals("Raccontaci la tua idea di festa: DJ set e luci architetturali", result.getMessaggio());
    }
}
