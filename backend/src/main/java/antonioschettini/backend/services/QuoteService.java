package antonioschettini.backend.services;

import antonioschettini.backend.entities.QuoteRequest;
import antonioschettini.backend.enums.QuoteStatus;
import antonioschettini.backend.exceptions.NotFoundException;
import antonioschettini.backend.recordsDTO.QuoteRequestDTO;
import antonioschettini.backend.repositories.QuoteRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class QuoteService {

    @Autowired
    private QuoteRequestRepository quoteRepository;

    @Autowired
    private EmailService emailService;

    public QuoteRequest createQuote(QuoteRequestDTO dto) {
        QuoteRequest quote = QuoteRequest.builder()
                .nome(dto.nome())
                .cognome(dto.cognome())
                .email(dto.email())
                .telefono(dto.telefono())
                .dataEvento(dto.dataEvento())
                .tipoEvento(dto.tipoEvento())
                .location(dto.location())
                .numeroOspiti(dto.numeroOspiti())
                .orarioGiornata(dto.orarioGiornata())
                .tipoCerimonia(dto.tipoCerimonia())
                .messaggio(dto.messaggio())
                .budget(dto.budget())
                .lingua(dto.lingua() != null && !dto.lingua().isBlank() ? dto.lingua() : "it")
                .stato(QuoteStatus.PENDING)
                .build();

        QuoteRequest saved = quoteRepository.save(quote);

        // Invio notifiche email trasparenti in background/async
        emailService.sendQuoteNotificationEmail(saved);
        emailService.sendConfirmationEmailToClient(saved);

        return saved;
    }

    public List<QuoteRequest> getAllQuotes(QuoteStatus status) {
        if (status != null) {
            return quoteRepository.findByStatoOrderByDataRichiestaDesc(status);
        }
        return quoteRepository.findAllByOrderByDataRichiestaDesc();
    }

    public QuoteRequest getQuoteById(UUID id) {
        return quoteRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Richiesta preventivo non trovata con ID: " + id));
    }

    public QuoteRequest updateQuoteStatus(UUID id, QuoteStatus newStatus) {
        QuoteRequest quote = getQuoteById(id);
        quote.setStato(newStatus);
        return quoteRepository.save(quote);
    }

    public void deleteQuote(UUID id) {
        QuoteRequest quote = getQuoteById(id);
        quoteRepository.delete(quote);
    }

    public String generateIcsContent(UUID id) {
        QuoteRequest quote = getQuoteById(id);
        return generateIcsContent(quote);
    }

    public String generateIcsContent(QuoteRequest quote) {
        if (quote == null || quote.getDataEvento() == null) {
            throw new IllegalStateException("Data evento non specificata per la richiesta preventivo");
        }

        String dtStart = quote.getDataEvento().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        String dtEnd = quote.getDataEvento().plusDays(1).format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        String now = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'"));

        StringBuilder desc = new StringBuilder();
        desc.append("Cliente: ").append(quote.getNome()).append(" ").append(quote.getCognome()).append("\\n");
        desc.append("Tipo Evento: ").append(quote.getTipoEvento() != null ? quote.getTipoEvento() : "Non specificato").append("\\n");
        desc.append("Email: ").append(quote.getEmail()).append("\\n");
        desc.append("Telefono: ").append(quote.getTelefono() != null ? quote.getTelefono() : "Non specificato").append("\\n");
        if (quote.getNumeroOspiti() != null) desc.append("Ospiti: ").append(quote.getNumeroOspiti()).append("\\n");
        if (quote.getOrarioGiornata() != null) desc.append("Fascia Oraria: ").append(quote.getOrarioGiornata()).append("\\n");
        if (quote.getMessaggio() != null && !quote.getMessaggio().isBlank()) {
            desc.append("Messaggio: ").append(quote.getMessaggio().replace("\r\n", " ").replace("\n", " ").replace("\r", " "));
        }

        StringBuilder sb = new StringBuilder();
        sb.append("BEGIN:VCALENDAR\r\n");
        sb.append("VERSION:2.0\r\n");
        sb.append("PRODID:-//VINCO EVENTI//Gestione Preventivi//IT\r\n");
        sb.append("CALSCALE:GREGORIAN\r\n");
        sb.append("METHOD:REQUEST\r\n");
        sb.append("BEGIN:VEVENT\r\n");
        sb.append("UID:quote-").append(quote.getId()).append("@vincoeventi.it\r\n");
        sb.append("DTSTAMP:").append(now).append("\r\n");
        sb.append("DTSTART;VALUE=DATE:").append(dtStart).append("\r\n");
        sb.append("DTEND;VALUE=DATE:").append(dtEnd).append("\r\n");
        sb.append("SUMMARY:Evento VINCO EVENTI - ").append(escapeIcsText(quote.getNome() + " " + quote.getCognome())).append("\r\n");
        sb.append("DESCRIPTION:").append(escapeIcsText(desc.toString())).append("\r\n");
        if (quote.getLocation() != null && !quote.getLocation().isBlank()) {
            sb.append("LOCATION:").append(escapeIcsText(quote.getLocation())).append("\r\n");
        }
        sb.append("STATUS:CONFIRMED\r\n");
        sb.append("END:VEVENT\r\n");
        sb.append("END:VCALENDAR\r\n");

        return sb.toString();
    }

    private String escapeIcsText(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                   .replace(";", "\\;")
                   .replace(",", "\\,");
    }
}
