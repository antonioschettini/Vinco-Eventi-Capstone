package antonioschettini.backend;

import antonioschettini.backend.services.MatrimonioStatsService;
import antonioschettini.backend.services.MatrimonioStatsService.MatrimonioStatsDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MatrimonioStatsServiceTest {

    private MatrimonioStatsService matrimonioStatsService;

    @BeforeEach
    void setUp() {
        matrimonioStatsService = new MatrimonioStatsService();
    }

    @Test
    void testGetMatrimonioStatsReturnsValidData() {
        MatrimonioStatsDTO dto = matrimonioStatsService.getMatrimonioStats();
        assertNotNull(dto, "Il DTO non deve essere null");
        assertTrue(dto.totalReviews() >= 123, "Il numero totale di recensioni deve essere almeno 123");
        assertEquals(5.0, dto.rating(), "Il rating deve essere 5.0");
        assertNotNull(dto.vendorUrl(), "L'URL del fornitore non deve essere null");
        assertTrue(dto.vendorUrl().contains("matrimonio.com"), "L'URL deve contenere matrimonio.com");
    }
}
