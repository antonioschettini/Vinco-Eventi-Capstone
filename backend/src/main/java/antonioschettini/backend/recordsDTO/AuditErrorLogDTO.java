package antonioschettini.backend.recordsDTO;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO per la visualizzazione di un errore API nel pannello admin.
 * Non espone il stackTrace per default — solo su richiesta esplicita.
 */
public record AuditErrorLogDTO(
        UUID id,
        String httpMethod,
        String requestUri,
        Integer httpStatus,
        String errorType,
        String errorMessage,
        String ipAddress,
        LocalDateTime occurredAt
) {}
