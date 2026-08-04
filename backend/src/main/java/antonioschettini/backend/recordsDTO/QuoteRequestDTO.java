package antonioschettini.backend.recordsDTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

public record QuoteRequestDTO(
        @NotEmpty(message = "Il nome è obbligatorio")
        String nome,

        @NotEmpty(message = "Il cognome è obbligatorio")
        String cognome,

        @NotEmpty(message = "L'email è obbligatoria")
        @Email(message = "Inserisci un'email valida")
        String email,

        @NotEmpty(message = "Il telefono è obbligatorio")
        String telefono,

        LocalDate dataEvento,
        String tipoEvento,

        @NotEmpty(message = "Il luogo dell'evento è obbligatorio")
        @Pattern(
                regexp = "^[^,]+,.+$",
                message = "Il luogo dell'evento deve contenere sia il luogo che la località separati da una virgola (es. Masseria Coccaro, Monopoli)"
        )
        String location,
        String numeroOspiti,
        String orarioGiornata,
        String tipoCerimonia,
        String messaggio,
        String budget,
        String lingua
) {}
