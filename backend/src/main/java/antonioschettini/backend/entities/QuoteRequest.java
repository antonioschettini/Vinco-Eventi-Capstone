package antonioschettini.backend.entities;

import antonioschettini.backend.enums.QuoteStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "quote_requests",
    indexes = {
        @Index(name = "idx_quote_data_richiesta", columnList = "data_richiesta DESC"),
        @Index(name = "idx_quote_stato", columnList = "stato")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuoteRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private String cognome;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String telefono;

    @Column(name = "data_evento")
    private LocalDate dataEvento;

    @Column(name = "tipo_evento")
    private String tipoEvento;

    private String location;

    @Column(name = "numero_ospiti")
    private String numeroOspiti;

    @Column(name = "orario_giornata")
    private String orarioGiornata;

    @Column(name = "tipo_cerimonia")
    private String tipoCerimonia;

    @Column(columnDefinition = "TEXT")
    private String messaggio;

    private String budget;

    private String lingua;

    @Column(name = "data_richiesta")
    private LocalDateTime dataRichiesta;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuoteStatus stato;

    @PrePersist
    public void onCreate() {
        if (this.dataRichiesta == null) {
            this.dataRichiesta = LocalDateTime.now();
        }
        if (this.stato == null) {
            this.stato = QuoteStatus.PENDING;
        }
        if (this.lingua == null || this.lingua.isBlank()) {
            this.lingua = "it";
        }
    }
}
