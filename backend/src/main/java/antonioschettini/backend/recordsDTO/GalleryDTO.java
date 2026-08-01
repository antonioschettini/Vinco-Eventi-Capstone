package antonioschettini.backend.recordsDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record GalleryDTO(
        @NotBlank(message = "Il titolo in italiano è obbligatorio")
        String titleIta,

        @NotBlank(message = "Il titolo in inglese è obbligatorio")
        String titleEng,

        String subtitleIta,
        String subtitleEng,

        @NotBlank(message = "Il tipo (image/video) è obbligatorio")
        String type,

        @NotBlank(message = "L'URL della risorsa multimediale è obbligatorio")
        String src,

        String category,

        @NotNull(message = "Lo stato 'In Evidenza' è obbligatorio")
        Boolean featured,

        Double startTime,
        Integer displayOrder,
        String publicId,
        String posterUrl
) {}
