package antonioschettini.backend.controllers;

import antonioschettini.backend.recordsDTO.AuditErrorLogDTO;
import antonioschettini.backend.recordsDTO.AuditStatsDTO;
import antonioschettini.backend.services.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * Controller REST per il pannello di auditing admin.
 * Tutti gli endpoint richiedono ROLE_ADMIN.
 *
 * Endpoint:
 *   GET /api/admin/audit/errors         → lista paginata degli ultimi errori
 *   GET /api/admin/audit/stats          → statistiche aggregate (visite + errori)
 */
@RestController
@RequestMapping("/api/admin/audit")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminAuditController {

    @Autowired
    private AuditService auditService;

    /**
     * Ritorna la lista paginata degli ultimi errori API per la tabella admin.
     *
     * @param page numero di pagina (default 0)
     * @param size dimensione pagina (default 20, max 100)
     */
    @GetMapping("/errors")
    public ResponseEntity<Page<AuditErrorLogDTO>> getRecentErrors(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(auditService.getRecentErrors(page, size));
    }

    /**
     * Ritorna le statistiche aggregate nel range di date specificato.
     * Un unico endpoint per minimizzare le chiamate dal frontend (ottimizzazione free tier).
     *
     * @param from data inizio (ISO: YYYY-MM-DD), default: 30 giorni fa
     * @param to   data fine   (ISO: YYYY-MM-DD), default: oggi
     */
    @GetMapping("/stats")
    public ResponseEntity<AuditStatsDTO> getStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        if (from == null) from = LocalDate.now().minusDays(30);
        if (to == null) to = LocalDate.now();

        // Validazione range massimo (90 giorni per non sovraccaricare il DB free tier)
        if (from.plusDays(90).isBefore(to)) {
            from = to.minusDays(90);
        }

        return ResponseEntity.ok(auditService.getStats(from, to));
    }
}
