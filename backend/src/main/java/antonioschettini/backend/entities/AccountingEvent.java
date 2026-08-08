package antonioschettini.backend.entities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "accounting_events",
    indexes = {
        @Index(name = "idx_agenda_data_evento", columnList = "data_evento"),
        @Index(name = "idx_agenda_quote_id", columnList = "quote_request_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountingEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "quote_request_id")
    private UUID quoteRequestId;

    @Column(nullable = false)
    private String titolo;

    @Column(name = "cliente_nome")
    private String clienteNome;

    @Column(name = "cliente_cognome")
    private String clienteCognome;

    @Column(name = "cliente_email")
    private String clienteEmail;

    @Column(name = "cliente_telefono")
    private String clienteTelefono;

    @Column(name = "data_evento")
    private LocalDate dataEvento;

    private String location;

    @Column(name = "tipo_evento")
    private String tipoEvento;

    @Builder.Default
    @Column(name = "importo_lordo", precision = 12, scale = 2)
    private BigDecimal importoLordo = BigDecimal.ZERO;

    @Column(name = "spese_json", columnDefinition = "TEXT")
    private String speseJson;

    @Builder.Default
    @Column(name = "totale_spese", precision = 12, scale = 2)
    private BigDecimal totaleSpese = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "totale_netto", precision = 12, scale = 2)
    private BigDecimal totaleNetto = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "tasse_stimate", precision = 12, scale = 2)
    private BigDecimal tasseStimate = BigDecimal.ZERO;

    @Column(name = "contratto_url")
    private String contrattoUrl;

    @Column(name = "contratto_public_id")
    private String contrattoPublicId;

    @Column(name = "contratto_nome_file")
    private String contrattoNomeFile;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Builder.Default
    @Column(name = "is_manual", nullable = false)
    private boolean isManual = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.importoLordo == null) this.importoLordo = BigDecimal.ZERO;
        if (this.totaleSpese == null) this.totaleSpese = BigDecimal.ZERO;
        if (this.totaleNetto == null) this.totaleNetto = this.importoLordo.subtract(this.totaleSpese);
        if (this.tasseStimate == null) this.tasseStimate = BigDecimal.ZERO;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        if (this.importoLordo == null) this.importoLordo = BigDecimal.ZERO;
        if (this.totaleSpese == null) this.totaleSpese = BigDecimal.ZERO;
        this.totaleNetto = this.importoLordo.subtract(this.totaleSpese);
    }
}
