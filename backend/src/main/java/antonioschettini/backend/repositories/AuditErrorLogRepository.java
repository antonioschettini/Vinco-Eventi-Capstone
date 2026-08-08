package antonioschettini.backend.repositories;

import antonioschettini.backend.entities.AuditErrorLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditErrorLogRepository extends JpaRepository<AuditErrorLog, UUID> {

    /**
     * Ultimi N errori ordinati per data decrescente (per la tabella admin).
     */
    Page<AuditErrorLog> findAllByOrderByOccurredAtDesc(Pageable pageable);

    /**
     * Aggregazione: numero di errori raggruppati per httpStatus in un range di date.
     * Ritorna Object[] con [httpStatus, count].
     */
    @Query("SELECT e.httpStatus, COUNT(e) FROM AuditErrorLog e " +
           "WHERE e.occurredAt BETWEEN :from AND :to " +
           "GROUP BY e.httpStatus ORDER BY COUNT(e) DESC")
    List<Object[]> countGroupedByStatus(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    /**
     * Aggregazione: errori giornalieri nel range specificato.
     * Usa query nativa PostgreSQL per DATE() — più affidabile di JPQL CAST su tutti i provider.
     * Ritorna Object[] con [date::text, count].
     */
    @Query(value = "SELECT DATE(occurred_at)::text AS day, COUNT(*) AS cnt " +
                   "FROM audit_error_log " +
                   "WHERE occurred_at BETWEEN :from AND :to " +
                   "GROUP BY day ORDER BY day ASC",
           nativeQuery = true)
    List<Object[]> countGroupedByDay(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    /**
     * Retention policy: elimina log più vecchi di una certa data.
     */
    @Modifying
    @Query("DELETE FROM AuditErrorLog e WHERE e.occurredAt < :cutoff")
    int deleteOlderThan(@Param("cutoff") LocalDateTime cutoff);

    long countByOccurredAtBetween(LocalDateTime from, LocalDateTime to);
}
