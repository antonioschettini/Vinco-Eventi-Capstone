package antonioschettini.backend.repositories;

import antonioschettini.backend.entities.AccountingEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountingEventRepository extends JpaRepository<AccountingEvent, UUID> {

    Optional<AccountingEvent> findByQuoteRequestId(UUID quoteRequestId);

    List<AccountingEvent> findByDataEventoBetweenOrderByDataEventoAsc(LocalDate start, LocalDate end);

    List<AccountingEvent> findAllByOrderByDataEventoAsc();

    void deleteByQuoteRequestId(UUID quoteRequestId);
}
