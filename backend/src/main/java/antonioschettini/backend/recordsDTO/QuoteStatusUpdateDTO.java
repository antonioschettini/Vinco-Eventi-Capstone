package antonioschettini.backend.recordsDTO;

import antonioschettini.backend.enums.QuoteStatus;
import jakarta.validation.constraints.NotNull;

public record QuoteStatusUpdateDTO(
        @NotNull(message = "Lo stato è obbligatorio")
        QuoteStatus stato
) {}
