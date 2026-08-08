package antonioschettini.backend.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Rappresenta un errore API persistito per il sistema di auditing.
 * Viene popolato dal GlobalExceptionHandler su ogni eccezione gestita.
 */
@Entity
@Table(name = "audit_error_log", indexes = {
        @Index(name = "idx_audit_error_occurred", columnList = "occurred_at"),
        @Index(name = "idx_audit_error_status", columnList = "http_status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditErrorLog {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "http_method", length = 10)
    private String httpMethod;

    @Column(name = "request_uri", length = 512)
    private String requestUri;

    @Column(name = "http_status")
    private Integer httpStatus;

    @Column(name = "error_type", length = 100)
    private String errorType;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @Column(name = "stack_trace", length = 3000)
    private String stackTrace;

    /**
     * UUID dell'utente autenticato, null se la richiesta era anonima.
     */
    @Column(name = "user_id")
    private UUID userId;

    /**
     * IP anonimizzato: ultimi due ottetti mascherati (es. 192.168.x.x) per conformità GDPR.
     */
    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;

    @PrePersist
    public void onPrePersist() {
        if (this.occurredAt == null) {
            this.occurredAt = LocalDateTime.now();
        }
    }
}
