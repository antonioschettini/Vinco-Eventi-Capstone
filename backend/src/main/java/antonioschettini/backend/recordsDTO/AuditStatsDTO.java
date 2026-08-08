package antonioschettini.backend.recordsDTO;

import java.util.List;
import java.util.Map;

/**
 * DTO aggregato per le statistiche di auditing.
 * Contiene errori per status code, visite giornaliere, top pagine e contatori globali.
 */
public record AuditStatsDTO(
        /**
         * Mappa httpStatus -> count per il grafico a barre degli errori.
         * Es: {"400": 12, "401": 5, "500": 3}
         */
        Map<String, Long> errorsByStatus,

        /**
         * Lista di punti dati per il grafico visite giornaliere.
         * Ogni entry: {"date": "2025-08-01", "count": 42}
         */
        List<DailyCount> visitsByDay,

        /**
         * Lista di punti dati per il grafico errori giornalieri.
         */
        List<DailyCount> errorsByDay,

        /**
         * Top pagine visitate nel periodo.
         * Ogni entry: {"uri": "/api/services", "count": 120}
         */
        List<PageCount> topPages,

        long totalVisits,
        long totalErrors
) {
    public record DailyCount(String date, long count) {}
    public record PageCount(String uri, long count) {}
}
