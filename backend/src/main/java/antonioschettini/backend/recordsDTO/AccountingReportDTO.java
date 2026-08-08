package antonioschettini.backend.recordsDTO;

import java.math.BigDecimal;

public record AccountingReportDTO(
    Integer anno,
    Integer mese,
    BigDecimal totaleLordo,
    BigDecimal totaleSpese,
    BigDecimal totaleNetto,
    BigDecimal stimaTasse,
    BigDecimal nettoPostTasse,
    long numeroEventi
) {}
