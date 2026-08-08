package antonioschettini.backend.controllers;

import antonioschettini.backend.entities.AccountingEvent;
import antonioschettini.backend.recordsDTO.AccountingEventDTO;
import antonioschettini.backend.recordsDTO.AccountingReportDTO;
import antonioschettini.backend.services.AccountingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/agenda")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminAccountingController {

    @Autowired
    private AccountingService accountingService;

    @GetMapping
    public ResponseEntity<List<AccountingEvent>> getAllEvents(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        List<AccountingEvent> events = accountingService.getAllEvents(year, month);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountingEvent> getEventById(@PathVariable UUID id) {
        AccountingEvent event = accountingService.getEventById(id);
        return ResponseEntity.ok(event);
    }

    @PostMapping
    public ResponseEntity<AccountingEvent> createManualEvent(@RequestBody @Valid AccountingEventDTO dto) {
        AccountingEvent created = accountingService.createManualEvent(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountingEvent> updateEvent(
            @PathVariable UUID id,
            @RequestBody @Valid AccountingEventDTO dto) {
        AccountingEvent updated = accountingService.updateEvent(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable UUID id) {
        accountingService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/contratto")
    public ResponseEntity<AccountingEvent> uploadContractPdf(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) {
        AccountingEvent updated = accountingService.uploadContractPdf(id, file);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}/contratto")
    public ResponseEntity<AccountingEvent> deleteContractPdf(@PathVariable UUID id) {
        AccountingEvent updated = accountingService.deleteContractPdf(id);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/report")
    public ResponseEntity<AccountingReportDTO> getFinancialReport(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        AccountingReportDTO report = accountingService.getFinancialReport(year, month);
        return ResponseEntity.ok(report);
    }
}
