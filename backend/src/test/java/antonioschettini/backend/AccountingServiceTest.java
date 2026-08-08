package antonioschettini.backend;

import antonioschettini.backend.entities.AccountingEvent;
import antonioschettini.backend.entities.QuoteRequest;
import antonioschettini.backend.recordsDTO.AccountingEventDTO;
import antonioschettini.backend.recordsDTO.AccountingReportDTO;
import antonioschettini.backend.repositories.AccountingEventRepository;
import antonioschettini.backend.services.AccountingService;
import antonioschettini.backend.services.CloudinaryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AccountingServiceTest {

    @Mock
    private AccountingEventRepository accountingRepository;

    @Mock
    private CloudinaryService cloudinaryService;

    @InjectMocks
    private AccountingService accountingService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testCreateManualEventCalculatesNettoCorrectly() {
        AccountingEventDTO dto = new AccountingEventDTO(
                null,
                "Matrimonio Monopoli",
                "Mario",
                "Rossi",
                "mario@example.com",
                "+39 3331234567",
                LocalDate.of(2026, 9, 15),
                LocalDate.of(2026, 9, 15),
                true,
                "Masseria Coccaro",
                "Matrimonio",
                new BigDecimal("2500.00"),
                "[{\"desc\":\"Service Audio\",\"costo\":300}]",
                new BigDecimal("300.00"),
                new BigDecimal("440.00"),
                "Note test",
                true
        );

        when(accountingRepository.save(any(AccountingEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AccountingEvent created = accountingService.createManualEvent(dto);

        assertNotNull(created);
        assertEquals(new BigDecimal("2500.00"), created.getImportoLordo());
        assertEquals(new BigDecimal("300.00"), created.getTotaleSpese());
        assertEquals(new BigDecimal("2200.00"), created.getTotaleNetto());
        assertEquals(new BigDecimal("440.00"), created.getTasseStimate());
    }

    @Test
    void testCreateOrLinkEventFromQuoteParsesBudgetRange() {
        QuoteRequest quote = QuoteRequest.builder()
                .id(UUID.randomUUID())
                .nome("Giuseppe")
                .cognome("Verdi")
                .email("giuseppe@example.com")
                .telefono("+39 3401234567")
                .dataEvento(LocalDate.of(2026, 10, 10))
                .tipoEvento("Festa di Laurea")
                .location("Villa Bianca, Bari")
                .budget("1.500€-3.000€")
                .build();

        when(accountingRepository.findByQuoteRequestId(quote.getId())).thenReturn(Optional.empty());
        when(accountingRepository.save(any(AccountingEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AccountingEvent event = accountingService.createOrLinkEventFromQuote(quote);

        assertNotNull(event);
        assertEquals(new BigDecimal("1500"), event.getImportoLordo());
        assertEquals("Evento - Giuseppe Verdi", event.getTitolo());
    }

    @Test
    void testGetFinancialReportAggregatesTotals() {
        AccountingEvent event1 = AccountingEvent.builder()
                .dataEvento(LocalDate.of(2026, 8, 1))
                .importoLordo(new BigDecimal("2000.00"))
                .totaleSpese(new BigDecimal("400.00"))
                .tasseStimate(new BigDecimal("320.00"))
                .build();

        AccountingEvent event2 = AccountingEvent.builder()
                .dataEvento(LocalDate.of(2026, 8, 20))
                .importoLordo(new BigDecimal("1500.00"))
                .totaleSpese(new BigDecimal("200.00"))
                .tasseStimate(new BigDecimal("260.00"))
                .build();

        when(accountingRepository.findEventsForPeriod(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(event1, event2));

        AccountingReportDTO report = accountingService.getFinancialReport(2026, 8);

        assertNotNull(report);
        assertEquals(2026, report.anno());
        assertEquals(8, report.mese());
        assertEquals(new BigDecimal("3500.00"), report.totaleLordo());
        assertEquals(new BigDecimal("600.00"), report.totaleSpese());
        assertEquals(new BigDecimal("2900.00"), report.totaleNetto());
        assertEquals(new BigDecimal("580.00"), report.stimaTasse());
        assertEquals(new BigDecimal("2320.00"), report.nettoPostTasse());
        assertEquals(2, report.numeroEventi());
    }
}
