package antonioschettini.backend.services;

import antonioschettini.backend.entities.AccountingEvent;
import antonioschettini.backend.entities.QuoteRequest;
import antonioschettini.backend.exceptions.NotFoundException;
import antonioschettini.backend.recordsDTO.AccountingEventDTO;
import antonioschettini.backend.recordsDTO.AccountingReportDTO;
import antonioschettini.backend.repositories.AccountingEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AccountingService {

    @Autowired
    private AccountingEventRepository accountingRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    public List<AccountingEvent> getAllEvents(Integer year, Integer month) {
        if (year != null && month != null) {
            YearMonth ym = YearMonth.of(year, month);
            LocalDate start = ym.atDay(1);
            LocalDate end = ym.atEndOfMonth();
            return accountingRepository.findByDataEventoBetweenOrderByDataEventoAsc(start, end);
        } else if (year != null) {
            LocalDate start = LocalDate.of(year, 1, 1);
            LocalDate end = LocalDate.of(year, 12, 31);
            return accountingRepository.findByDataEventoBetweenOrderByDataEventoAsc(start, end);
        }
        return accountingRepository.findAllByOrderByDataEventoAsc();
    }

    public AccountingEvent getEventById(UUID id) {
        return accountingRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Evento contabile non trovato con ID: " + id));
    }

    public AccountingEvent createManualEvent(AccountingEventDTO dto) {
        BigDecimal lordo = dto.importoLordo() != null ? dto.importoLordo() : BigDecimal.ZERO;
        BigDecimal spese = dto.totaleSpese() != null ? dto.totaleSpese() : BigDecimal.ZERO;
        BigDecimal netto = lordo.subtract(spese);
        BigDecimal tasse = dto.tasseStimate() != null ? dto.tasseStimate() : BigDecimal.ZERO;

        AccountingEvent event = AccountingEvent.builder()
                .quoteRequestId(dto.quoteRequestId())
                .titolo(dto.titolo())
                .clienteNome(dto.clienteNome())
                .clienteCognome(dto.clienteCognome())
                .clienteEmail(dto.clienteEmail())
                .clienteTelefono(dto.clienteTelefono())
                .dataEvento(dto.dataEvento())
                .location(dto.location())
                .tipoEvento(dto.tipoEvento())
                .importoLordo(lordo)
                .speseJson(dto.speseJson())
                .totaleSpese(spese)
                .totaleNetto(netto)
                .tasseStimate(tasse)
                .note(dto.note())
                .isManual(dto.isManual() != null ? dto.isManual() : true)
                .build();

        return accountingRepository.save(event);
    }

    @Transactional
    public AccountingEvent createOrLinkEventFromQuote(QuoteRequest quote) {
        if (quote == null) return null;

        Optional<AccountingEvent> existing = accountingRepository.findByQuoteRequestId(quote.getId());
        if (existing.isPresent()) {
            // Aggiorna le informazioni di base se già presente
            AccountingEvent ev = existing.get();
            ev.setTitolo("Evento - " + quote.getNome() + " " + quote.getCognome());
            ev.setClienteNome(quote.getNome());
            ev.setClienteCognome(quote.getCognome());
            ev.setClienteEmail(quote.getEmail());
            ev.setClienteTelefono(quote.getTelefono());
            ev.setDataEvento(quote.getDataEvento());
            ev.setLocation(quote.getLocation());
            ev.setTipoEvento(quote.getTipoEvento());
            return accountingRepository.save(ev);
        }

        BigDecimal importoEstimato = parseBudgetToBigDecimal(quote.getBudget());

        AccountingEvent newEvent = AccountingEvent.builder()
                .quoteRequestId(quote.getId())
                .titolo("Evento - " + quote.getNome() + " " + quote.getCognome())
                .clienteNome(quote.getNome())
                .clienteCognome(quote.getCognome())
                .clienteEmail(quote.getEmail())
                .clienteTelefono(quote.getTelefono())
                .dataEvento(quote.getDataEvento())
                .location(quote.getLocation())
                .tipoEvento(quote.getTipoEvento())
                .importoLordo(importoEstimato)
                .speseJson("[]")
                .totaleSpese(BigDecimal.ZERO)
                .totaleNetto(importoEstimato)
                .tasseStimate(BigDecimal.ZERO)
                .note("Generato automaticamente dalla richiesta preventivo (#" + quote.getId() + ")")
                .isManual(false)
                .build();

        return accountingRepository.save(newEvent);
    }

    @Transactional
    public AccountingEvent updateEvent(UUID id, AccountingEventDTO dto) {
        AccountingEvent event = getEventById(id);

        if (dto.titolo() != null && !dto.titolo().isBlank()) {
            event.setTitolo(dto.titolo());
        }
        event.setClienteNome(dto.clienteNome());
        event.setClienteCognome(dto.clienteCognome());
        event.setClienteEmail(dto.clienteEmail());
        event.setClienteTelefono(dto.clienteTelefono());
        event.setDataEvento(dto.dataEvento());
        event.setLocation(dto.location());
        event.setTipoEvento(dto.tipoEvento());

        BigDecimal lordo = dto.importoLordo() != null ? dto.importoLordo() : BigDecimal.ZERO;
        BigDecimal spese = dto.totaleSpese() != null ? dto.totaleSpese() : BigDecimal.ZERO;

        event.setImportoLordo(lordo);
        event.setSpeseJson(dto.speseJson());
        event.setTotaleSpese(spese);
        event.setTotaleNetto(lordo.subtract(spese));
        if (dto.tasseStimate() != null) {
            event.setTasseStimate(dto.tasseStimate());
        }
        event.setNote(dto.note());

        return accountingRepository.save(event);
    }

    @Transactional
    public void deleteEvent(UUID id) {
        AccountingEvent event = getEventById(id);
        if (event.getContrattoPublicId() != null && !event.getContrattoPublicId().isBlank()) {
            cloudinaryService.deleteMedia(event.getContrattoPublicId(), "raw", event.getContrattoUrl());
        }
        accountingRepository.delete(event);
    }

    @Transactional
    public void unlinkOrDeleteByQuoteId(UUID quoteId) {
        Optional<AccountingEvent> existing = accountingRepository.findByQuoteRequestId(quoteId);
        if (existing.isPresent()) {
            AccountingEvent event = existing.get();
            if (event.getContrattoPublicId() != null && !event.getContrattoPublicId().isBlank()) {
                cloudinaryService.deleteMedia(event.getContrattoPublicId(), "raw", event.getContrattoUrl());
            }
            accountingRepository.delete(event);
        }
    }

    @Transactional
    public AccountingEvent uploadContractPdf(UUID id, MultipartFile file) {
        AccountingEvent event = getEventById(id);
        try {
            // Rimuove il vecchio contratto se presente
            if (event.getContrattoPublicId() != null && !event.getContrattoPublicId().isBlank()) {
                cloudinaryService.deleteMedia(event.getContrattoPublicId(), "raw", event.getContrattoUrl());
            }
            Map<String, String> uploadRes = cloudinaryService.uploadContractPdf(file);
            event.setContrattoUrl(uploadRes.get("url"));
            event.setContrattoPublicId(uploadRes.get("publicId"));
            event.setContrattoNomeFile(uploadRes.get("filename"));
            return accountingRepository.save(event);
        } catch (Exception e) {
            throw new RuntimeException("Errore durante l'upload del contratto PDF: " + e.getMessage(), e);
        }
    }

    @Transactional
    public AccountingEvent deleteContractPdf(UUID id) {
        AccountingEvent event = getEventById(id);
        if (event.getContrattoPublicId() != null && !event.getContrattoPublicId().isBlank()) {
            cloudinaryService.deleteMedia(event.getContrattoPublicId(), "raw", event.getContrattoUrl());
        }
        event.setContrattoUrl(null);
        event.setContrattoPublicId(null);
        event.setContrattoNomeFile(null);
        return accountingRepository.save(event);
    }

    public AccountingReportDTO getFinancialReport(Integer year, Integer month) {
        List<AccountingEvent> events = getAllEvents(year, month);

        BigDecimal totaleLordo = BigDecimal.ZERO;
        BigDecimal totaleSpese = BigDecimal.ZERO;
        BigDecimal stimaTasse = BigDecimal.ZERO;

        for (AccountingEvent ev : events) {
            if (ev.getImportoLordo() != null) totaleLordo = totaleLordo.add(ev.getImportoLordo());
            if (ev.getTotaleSpese() != null) totaleSpese = totaleSpese.add(ev.getTotaleSpese());
            if (ev.getTasseStimate() != null) stimaTasse = stimaTasse.add(ev.getTasseStimate());
        }

        BigDecimal totaleNetto = totaleLordo.subtract(totaleSpese);
        BigDecimal nettoPostTasse = totaleNetto.subtract(stimaTasse);

        return new AccountingReportDTO(
                year,
                month,
                totaleLordo.setScale(2, RoundingMode.HALF_UP),
                totaleSpese.setScale(2, RoundingMode.HALF_UP),
                totaleNetto.setScale(2, RoundingMode.HALF_UP),
                stimaTasse.setScale(2, RoundingMode.HALF_UP),
                nettoPostTasse.setScale(2, RoundingMode.HALF_UP),
                events.size()
        );
    }

    private BigDecimal parseBudgetToBigDecimal(String budgetStr) {
        if (budgetStr == null || budgetStr.isBlank()) return BigDecimal.ZERO;
        try {
            // Estrae cifre numeriche es: "2000 €" -> "2000"
            String cleaned = budgetStr.replaceAll("[^0-9.,]", "").replace(",", ".");
            if (cleaned.isBlank()) return BigDecimal.ZERO;
            return new BigDecimal(cleaned);
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }
}
