package antonioschettini.backend.repositories;

import antonioschettini.backend.entities.AccountingEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountingEventRepository extends JpaRepository<AccountingEvent, UUID> {

    Optional<AccountingEvent> findByQuoteRequestId(UUID quoteRequestId);

    @Query("SELECT a FROM AccountingEvent a WHERE " +
           "(a.dataEvento BETWEEN :start AND :end) OR " +
           "(a.dataFineEvento IS NOT NULL AND a.dataFineEvento BETWEEN :start AND :end) OR " +
           "(a.dataFineEvento IS NOT NULL AND a.dataEvento <= :end AND a.dataFineEvento >= :start) " +
           "ORDER BY a.dataEvento ASC")
    List<AccountingEvent> findEventsForPeriod(@Param("start") LocalDate start, @Param("end") LocalDate end);

    List<AccountingEvent> findAllByOrderByDataEventoAsc();

    void deleteByQuoteRequestId(UUID quoteRequestId);
}
