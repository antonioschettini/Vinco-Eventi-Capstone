package antonioschettini.backend.recordsDTO;

import jakarta.validation.constraints.NotBlank;

public record TranslateRequestDTO(
        @NotBlank(message = "Il testo da tradurre è obbligatorio")
        String text,
        String sourceLang,
        String targetLang
) {}
