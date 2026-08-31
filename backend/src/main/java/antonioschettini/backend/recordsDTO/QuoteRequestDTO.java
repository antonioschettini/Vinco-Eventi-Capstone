package antonioschettini.backend.recordsDTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record QuoteRequestDTO(
        @NotEmpty(message = "Il nome è obbligatorio")
        @Size(min = 2, max = 50, message = "Il nome deve contenere tra 2 e 50 caratteri")
        @Pattern(
                regexp = "^[a-zA-Zà-ùÀ-Ùá-úÁ-Úä-üÄ-ÜñÑ\\s'-]+$",
                message = "Il nome può contenere solo lettere, spazi, apostrofi e trattini (senza cifre o simboli speciali)"
        )
        String nome,

        @NotEmpty(message = "Il cognome è obbligatorio")
        @Size(min = 2, max = 50, message = "Il cognome deve contenere tra 2 e 50 caratteri")
        @Pattern(
                regexp = "^[a-zA-Zà-ùÀ-Ùá-úÁ-Úä-üÄ-ÜñÑ\\s'-]+$",
                message = "Il cognome può contenere solo lettere, spazi, apostrofi e trattini (senza cifre o simboli speciali)"
        )
        String cognome,

        @NotEmpty(message = "L'email è obbligatoria")
        @Size(max = 100, message = "L'email non può superare 100 caratteri")
        @Email(message = "Inserisci un'email valida")
        @Pattern(
                regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
                message = "Formato email non valido"
        )
        String email,

        @NotEmpty(message = "Il telefono è obbligatorio")
        @Size(min = 6, max = 30, message = "Il numero di telefono deve contenere tra 6 e 30 caratteri")
        @Pattern(
                regexp = "^\\+?[0-9\\s()-]{6,30}$",
                message = "Inserisci un numero di telefono valido (solo cifre, spazi, prefisso e trattini)"
        )
        String telefono,

        LocalDate dataEvento,

        @Size(max = 80, message = "Il tipo di evento non può superare 80 caratteri")
        String tipoEvento,

        @NotEmpty(message = "Il luogo dell'evento è obbligatorio")
        @Size(min = 4, max = 150, message = "La location deve contenere tra 4 e 150 caratteri")
        @Pattern(
                regexp = "^[^,=<>;$%\\*|\\\\{}]{2,80},\\s*[^,=<>;$%\\*|\\\\{}]{2,50}$",
                message = "Il luogo dell'evento deve contenere Nome Struttura e Città/Località validi separati da virgola (es. Villa Belvedere, Roma), senza simboli speciali o numeri di injection"
        )
        String location,

        @Size(max = 20, message = "Il numero di ospiti non è valido")
        @Pattern(
                regexp = "^[1-9][0-9]{0,4}$",
                message = "Inserisci un numero di ospiti valido (es. 120)"
        )
        String numeroOspiti,

        @Size(max = 30, message = "L'orario della giornata non è valido")
        String orarioGiornata,

        @Size(max = 80, message = "Il tipo di cerimonia non può superare 80 caratteri")
        String tipoCerimonia,

        @Size(max = 2000, message = "Il messaggio non può superare 2000 caratteri")
        String messaggio,

        @Size(max = 50, message = "La fascia di budget non è valida")
        String budget,

        @Size(max = 10, message = "Il codice lingua non è valido")
        String lingua
) {}

