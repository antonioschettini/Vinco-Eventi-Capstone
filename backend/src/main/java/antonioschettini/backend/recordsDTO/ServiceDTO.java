package antonioschettini.backend.recordsDTO;

import jakarta.validation.constraints.NotEmpty;

public record ServiceDTO(
        @NotEmpty(message = "Il titolo in italiano è obbligatorio")
        String titleIta,

        @NotEmpty(message = "Il titolo in inglese è obbligatorio")
        String titleEng,

        String subtitleIta,
        String subtitleEng,

        @NotEmpty(message = "La categoria è obbligatoria")
        String category,

        String badge,
        String imageUrlIta,
        String imageUrlEng,
        String featuresIta,
        String featuresEng,
        String brochureUrlIta,
        String brochureUrlEng,
        Integer displayOrder
) {}
