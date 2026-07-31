package antonioschettini.backend.controllers;

import antonioschettini.backend.entities.QuoteRequest;
import antonioschettini.backend.recordsDTO.QuoteRequestDTO;
import antonioschettini.backend.services.QuoteService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/quotes")
public class QuoteController {

    @Autowired
    private QuoteService quoteService;

    @PostMapping
    public ResponseEntity<QuoteRequest> createQuoteRequest(@RequestBody @Valid QuoteRequestDTO dto) {
        QuoteRequest created = quoteService.createQuote(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
