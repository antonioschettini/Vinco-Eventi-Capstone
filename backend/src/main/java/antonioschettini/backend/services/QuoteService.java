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
}
