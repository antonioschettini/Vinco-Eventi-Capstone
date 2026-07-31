package antonioschettini.backend.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "services")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceEntity {

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
    private String category; // e.g. "PACKAGE" or "PROPOSAL"

    private String badge; // e.g. "BASIC", "PLUS", "FULL"

    @Column(name = "image_url_ita")
    private String imageUrlIta;

    @Column(name = "image_url_eng")
    private String imageUrlEng;

    @Column(name = "features_ita", columnDefinition = "TEXT")
    private String featuresIta; // JSON/Semicolon separated list of features

    @Column(name = "features_eng", columnDefinition = "TEXT")
    private String featuresEng;

    @Column(name = "brochure_url_ita")
    private String brochureUrlIta;

    @Column(name = "brochure_url_eng")
    private String brochureUrlEng;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
