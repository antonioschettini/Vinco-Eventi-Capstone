package antonioschettini.backend.recordsDTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;

public record LoginDTO(
        @NotEmpty(message = "L'email è obbligatoria")
        @Email(message = "Inserisci un'email valida")
        String email,

        @NotEmpty(message = "La password è obbligatoria")
        String password
) {}
