package antonioschettini.backend.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "gallery_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GalleryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "title_ita", nullable = false)
    private String titleIta;

    @Column(name = "title_eng", nullable = false)
    private String titleEng;

    @Column(name = "subtitle_ita", columnDefinition = "TEXT")
    private String subtitleIta;

    @Column(name = "subtitle_eng", columnDefinition = "TEXT")
    private String subtitleEng;

    @Column(nullable = false)
    private String type; // "image" or "video"

    @Column(columnDefinition = "TEXT", nullable = false)
    private String src; // Image or Video URL (Cloudinary or local asset path)

    private String category; // "djset", "band", "wedding", "lightshow", "live", "decor", "effects"

    @Column(nullable = false)
    private Boolean featured; // Is featured in top carousel ("Momenti in evidenza")

    @Column(name = "start_time")
    private Double startTime; // Video offset start time in seconds (e.g. 60.0 for 1:00)

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.featured == null) {
            this.featured = false;
        }
    }
}
