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

    @GetMapping("/{id}/calendar.ics")
    public ResponseEntity<byte[]> getQuoteCalendarIcs(@PathVariable java.util.UUID id) {
        String icsContent = quoteService.generateIcsContent(id);
        byte[] bytes = icsContent.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.parseMediaType("text/calendar; charset=UTF-8"));
        headers.setContentDisposition(org.springframework.http.ContentDisposition.inline().filename("evento-vinco-" + id + ".ics").build());
        headers.setCacheControl("no-cache, no-store, must-revalidate");
        return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
    }
}
