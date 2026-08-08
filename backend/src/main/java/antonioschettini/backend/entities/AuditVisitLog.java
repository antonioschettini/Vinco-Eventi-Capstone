package antonioschettini.backend.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Rappresenta una visita (richiesta HTTP completata) persistita per il tracking.
 * Viene popolato dall'AuditInterceptor dopo ogni richiesta completata con successo.
 * Traccia sia utenti autenticati che anonimi.
 */
@Entity
@Table(name = "audit_visit_log", indexes = {
        @Index(name = "idx_audit_visit_visited", columnList = "visited_at"),
        @Index(name = "idx_audit_visit_uri", columnList = "request_uri")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditVisitLog {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "request_uri", length = 512)
    private String requestUri;

    @Column(name = "http_method", length = 10)
    private String httpMethod;

    @Column(name = "http_status")
    private Integer httpStatus;

    /**
     * IP anonimizzato: ultimi due ottetti mascherati per conformità GDPR.
     * Esempio: 192.168.x.x
     */
    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    /**
     * User-Agent del browser/device (troncato a 300 caratteri).
     */
    @Column(name = "user_agent", length = 300)
    private String userAgent;

    /**
     * UUID dell'utente autenticato, null se la richiesta era anonima.
     */
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "visited_at", nullable = false)
    private LocalDateTime visitedAt;

    @PrePersist
    public void onPrePersist() {
        if (this.visitedAt == null) {
            this.visitedAt = LocalDateTime.now();
        }
    }
}
