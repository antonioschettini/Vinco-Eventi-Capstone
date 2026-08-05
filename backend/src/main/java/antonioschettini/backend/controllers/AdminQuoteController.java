package antonioschettini.backend.controllers;

import antonioschettini.backend.entities.QuoteRequest;
import antonioschettini.backend.enums.QuoteStatus;
import antonioschettini.backend.recordsDTO.QuoteStatusUpdateDTO;
import antonioschettini.backend.recordsDTO.TranslateRequestDTO;
import antonioschettini.backend.services.QuoteService;
import antonioschettini.backend.services.TranslationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/quotes")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminQuoteController {

    @Autowired
    private QuoteService quoteService;

    @Autowired
    private TranslationService translationService;

    @GetMapping
    public ResponseEntity<List<QuoteRequest>> getAllQuotes(@RequestParam(required = false) QuoteStatus status) {
        List<QuoteRequest> quotes = quoteService.getAllQuotes(status);
        return ResponseEntity.ok(quotes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuoteRequest> getQuoteById(@PathVariable UUID id) {
        QuoteRequest quote = quoteService.getQuoteById(id);
        return ResponseEntity.ok(quote);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<QuoteRequest> updateQuoteStatus(
            @PathVariable UUID id,
            @RequestBody @Valid QuoteStatusUpdateDTO dto) {
        QuoteRequest updated = quoteService.updateQuoteStatus(id, dto.stato());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuote(@PathVariable UUID id) {
        quoteService.deleteQuote(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/translate")
    public ResponseEntity<Map<String, String>> translateText(@RequestBody @Valid TranslateRequestDTO dto) {
        String translated = translationService.translate(dto.text(), dto.sourceLang(), dto.targetLang());
        return ResponseEntity.ok(Map.of("translatedText", translated));
    }
}
