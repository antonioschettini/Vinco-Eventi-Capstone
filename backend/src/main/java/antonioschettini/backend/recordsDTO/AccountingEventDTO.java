package antonioschettini.backend.recordsDTO;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record AccountingEventDTO(
    UUID quoteRequestId,
    @NotBlank(message = "Il titolo dell'evento è obbligatorio")
    String titolo,
    String clienteNome,
    String clienteCognome,
    String clienteEmail,
    String clienteTelefono,
    LocalDate dataEvento,
    LocalDate dataFineEvento,
    Boolean hasDjSet,
    String location,
    String tipoEvento,
    BigDecimal importoLordo,
    String speseJson,
    BigDecimal totaleSpese,
    BigDecimal tasseStimate,
    String note,
    Boolean isManual
) {}
