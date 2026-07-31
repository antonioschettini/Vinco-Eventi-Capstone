package antonioschettini.backend.repositories;

import antonioschettini.backend.entities.QuoteRequest;
import antonioschettini.backend.enums.QuoteStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuoteRequestRepository extends JpaRepository<QuoteRequest, UUID> {
    List<QuoteRequest> findByStatoOrderByDataRichiestaDesc(QuoteStatus stato);
    List<QuoteRequest> findAllByOrderByDataRichiestaDesc();
}
