package antonioschettini.backend.services;

import antonioschettini.backend.entities.AuditErrorLog;
import antonioschettini.backend.entities.AuditVisitLog;
import antonioschettini.backend.entities.User;
import antonioschettini.backend.recordsDTO.AuditErrorLogDTO;
import antonioschettini.backend.recordsDTO.AuditStatsDTO;
import antonioschettini.backend.repositories.AuditErrorLogRepository;
import antonioschettini.backend.repositories.AuditVisitLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Servizio centralizzato per l'auditing.
 *
 * IMPORTANTE — Pattern corretto per @Async + HttpServletRequest:
 * Il Servlet container riusa/ricicla l'HttpServletRequest dopo il completamento
 * della request. Tutti i dati necessari vengono estratti in modo SINCRONO
 * dal thread della request, prima che il metodo @Async venga schedulato.
 *
 * Tutti i metodi pubblici di scrittura estraggono i dati necessari sincronamente,
 * poi delegano ad un metodo privato @Async che riceve solo stringhe/UUID/primitivi.
 *
 * Retention policy: i log più vecchi di 90 giorni vengono eliminati
 * automaticamente ogni giorno a mezzanotte via @Scheduled.
 */
@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    @org.springframework.beans.factory.annotation.Value("${audit.retention-days:30}")
    private int retentionDays = 30;

    @Autowired
    private AuditErrorLogRepository errorLogRepository;

    @Autowired
    private AuditVisitLogRepository visitLogRepository;

    // ─────────────────────────────────────────────────────────────
    // WRITE METHODS — Estrazione sincrona + persistenza async
    // ─────────────────────────────────────────────────────────────

    /**
     * Persiste un errore API. Chiamato dal GlobalExceptionHandler.
     * Estrae i dati dalla request in modo SINCRONO prima dell'@Async.
     */
    public void logError(HttpServletRequest request, Exception ex, int httpStatus) {
        // Estrazione sincrona — il request object è ancora valido qui
        String method   = request.getMethod();
        String uri      = truncate(request.getRequestURI(), 512);
        String ip       = anonymizeIp(getClientIp(request));
        String errType  = ex.getClass().getSimpleName();
        String errMsg   = truncate(ex.getMessage(), 1000);
        String stack    = truncate(getStackTrace(ex), 3000);
        UUID userId     = extractUserId();
        // Delega la persistenza al thread asincrono con solo dati primitivi/value objects
        persistErrorAsync(method, uri, httpStatus, errType, errMsg, stack, ip, userId);
    }

    /**
     * Persiste una visita. Chiamato dall'AuditInterceptor dopo ogni request completata.
     * Estrae i dati dalla request in modo SINCRONO prima dell'@Async.
     */
    public void logVisit(HttpServletRequest request, Authentication authentication, int httpStatus) {
        // Estrazione sincrona — il request object è ancora valido qui
        String uri       = truncate(request.getRequestURI(), 512);
        String method    = request.getMethod();
        String ip        = anonymizeIp(getClientIp(request));
        String userAgent = truncate(request.getHeader("User-Agent"), 300);
        UUID userId = null;
        if (authentication != null && authentication.isAuthenticated()
                && authentication.getPrincipal() instanceof User user) {
            userId = user.getId();
        }
        persistVisitAsync(uri, method, httpStatus, ip, userAgent, userId);
    }

    // ─────────────────────────────────────────────────────────────
    // ASYNC persistence — ricevono solo value objects (thread-safe)
    // ─────────────────────────────────────────────────────────────

    @Async
    protected void persistErrorAsync(String method, String uri, int httpStatus,
                                     String errorType, String errorMessage, String stackTrace,
                                     String ipAddress, UUID userId) {
        try {
            AuditErrorLog entry = AuditErrorLog.builder()
                    .httpMethod(method)
                    .requestUri(uri)
                    .httpStatus(httpStatus)
                    .errorType(errorType)
                    .errorMessage(errorMessage)
                    .stackTrace(stackTrace)
                    .userId(userId)
                    .ipAddress(ipAddress)
                    .occurredAt(LocalDateTime.now())
                    .build();
            errorLogRepository.save(entry);
        } catch (Exception e) {
            log.error("AuditService: impossibile salvare error log", e);
        }
    }

    @Async
    protected void persistVisitAsync(String uri, String method, int httpStatus,
                                     String ipAddress, String userAgent, UUID userId) {
        try {
            AuditVisitLog entry = AuditVisitLog.builder()
                    .requestUri(uri)
                    .httpMethod(method)
                    .httpStatus(httpStatus)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .userId(userId)
                    .visitedAt(LocalDateTime.now())
                    .build();
            visitLogRepository.save(entry);
        } catch (Exception e) {
            log.error("AuditService: impossibile salvare visit log", e);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // READ METHODS (per AdminAuditController)
    // ─────────────────────────────────────────────────────────────

    /**
     * Ritorna gli ultimi errori paginati (per la tabella admin).
     */
    @Transactional(readOnly = true)
    public Page<AuditErrorLogDTO> getRecentErrors(int page, int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 100));
        return errorLogRepository.findAllByOrderByOccurredAtDesc(pageable)
                .map(this::toDTO);
    }

    /**
     * Ritorna le statistiche aggregate per il range di date specificato.
     * Un unico endpoint per minimizzare le chiamate dal frontend (ottimizzazione free tier).
     */
    @Transactional(readOnly = true)
    public AuditStatsDTO getStats(LocalDate from, LocalDate to) {
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt = to.plusDays(1).atStartOfDay();

        // Errori per status code
        Map<String, Long> errorsByStatus = new LinkedHashMap<>();
        for (Object[] row : errorLogRepository.countGroupedByStatus(fromDt, toDt)) {
            errorsByStatus.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }

        // Errori giornalieri (query nativa — row[0]=date string, row[1]=count)
        List<AuditStatsDTO.DailyCount> errorsByDay = errorLogRepository
                .countGroupedByDay(fromDt, toDt)
                .stream()
                .map(row -> new AuditStatsDTO.DailyCount(
                        String.valueOf(row[0]),
                        ((Number) row[1]).longValue()))
                .toList();

        // Visite giornaliere (query nativa — stesso pattern)
        List<AuditStatsDTO.DailyCount> visitsByDay = visitLogRepository
                .countGroupedByDay(fromDt, toDt)
                .stream()
                .map(row -> new AuditStatsDTO.DailyCount(
                        String.valueOf(row[0]),
                        ((Number) row[1]).longValue()))
                .toList();

        // Top 10 pagine (query nativa con LIMIT 10)
        List<AuditStatsDTO.PageCount> topPages = visitLogRepository
                .findTopPages(fromDt, toDt)
                .stream()
                .map(row -> new AuditStatsDTO.PageCount(
                        (String) row[0],
                        ((Number) row[1]).longValue()))
                .toList();

        long totalVisits = visitLogRepository.countByVisitedAtBetween(fromDt, toDt);
        long totalErrors = errorLogRepository.countByOccurredAtBetween(fromDt, toDt);

        return new AuditStatsDTO(errorsByStatus, visitsByDay, errorsByDay, topPages, totalVisits, totalErrors);
    }

    // ─────────────────────────────────────────────────────────────
    // RETENTION POLICY — eseguita ogni giorno a mezzanotte
    // ─────────────────────────────────────────────────────────────

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void cleanOldLogs() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionDays);
        int deletedErrors = errorLogRepository.deleteOlderThan(cutoff);
        int deletedVisits = visitLogRepository.deleteOlderThan(cutoff);
        log.info("AuditService retention: eliminati {} error log e {} visit log più vecchi di {} giorni",
                deletedErrors, deletedVisits, retentionDays);
    }

    // ─────────────────────────────────────────────────────────────
    // UTILITY PRIVATI
    // ─────────────────────────────────────────────────────────────

    private AuditErrorLogDTO toDTO(AuditErrorLog e) {
        return new AuditErrorLogDTO(
                e.getId(),
                e.getHttpMethod(),
                e.getRequestUri(),
                e.getHttpStatus(),
                e.getErrorType(),
                e.getErrorMessage(),
                e.getIpAddress(),
                e.getOccurredAt()
        );
    }

    /**
     * Estrae l'IP reale del client gestendo proxy e load balancer (X-Forwarded-For).
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Anonimizza l'IP mascherando gli ultimi due ottetti per conformità GDPR.
     * IPv4: 192.168.1.100 → 192.168.x.x
     * IPv6: tronca dopo il terzo gruppo
     */
    private String anonymizeIp(String ip) {
        if (ip == null || ip.isBlank()) return "unknown";
        if (ip.contains(":")) {
            // IPv6: mantieni solo i primi 3 gruppi
            String[] parts = ip.split(":");
            if (parts.length >= 3) {
                return parts[0] + ":" + parts[1] + ":" + parts[2] + ":x:x:x:x:x";
            }
            return "ipv6:x";
        }
        // IPv4
        String[] parts = ip.split("\\.");
        if (parts.length == 4) {
            return parts[0] + "." + parts[1] + ".x.x";
        }
        return ip;
    }

    /**
     * Estrae lo userId dal SecurityContext (sincrono — chiamato dal thread della request).
     */
    private UUID extractUserId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof User user) {
                return user.getId();
            }
        } catch (Exception ignored) {}
        return null;
    }

    private String getStackTrace(Exception ex) {
        StringWriter sw = new StringWriter();
        ex.printStackTrace(new PrintWriter(sw));
        return sw.toString();
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return null;
        return value.length() > maxLength ? value.substring(0, maxLength) : value;
    }
}
