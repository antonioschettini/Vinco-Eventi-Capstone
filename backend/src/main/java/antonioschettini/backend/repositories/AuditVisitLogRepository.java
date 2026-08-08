package antonioschettini.backend.repositories;

import antonioschettini.backend.entities.AuditVisitLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditVisitLogRepository extends JpaRepository<AuditVisitLog, UUID> {

    /**
     * Aggregazione: visite giornaliere nel range specificato.
     * Usa query nativa PostgreSQL per DATE() — più affidabile di JPQL CAST su tutti i provider.
     * Ritorna Object[] con [date::text, count].
     */
    @Query(value = "SELECT DATE(visited_at)::text AS day, COUNT(*) AS cnt " +
                   "FROM audit_visit_log " +
                   "WHERE visited_at BETWEEN :from AND :to " +
                   "GROUP BY day ORDER BY day ASC",
           nativeQuery = true)
    List<Object[]> countGroupedByDay(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    /**
     * Top N pagine più visitate nel range specificato.
     * Usa query nativa con LIMIT per evitare comportamenti inattesi di Pageable su GROUP BY.
     * Ritorna Object[] con [request_uri, count].
     */
    @Query(value = "SELECT request_uri, COUNT(*) AS cnt " +
                   "FROM audit_visit_log " +
                   "WHERE visited_at BETWEEN :from AND :to " +
                   "GROUP BY request_uri ORDER BY cnt DESC LIMIT 10",
           nativeQuery = true)
    List<Object[]> findTopPages(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    long countByVisitedAtBetween(LocalDateTime from, LocalDateTime to);

    /**
     * Retention policy: elimina log più vecchi di una certa data.
     */
    @Modifying
    @Query("DELETE FROM AuditVisitLog v WHERE v.visitedAt < :cutoff")
    int deleteOlderThan(@Param("cutoff") LocalDateTime cutoff);
}
