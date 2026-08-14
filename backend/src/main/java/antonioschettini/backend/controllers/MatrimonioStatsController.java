package antonioschettini.backend.controllers;

import antonioschettini.backend.services.MatrimonioStatsService;
import antonioschettini.backend.services.MatrimonioStatsService.MatrimonioStatsDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/matrimonio-stats")
public class MatrimonioStatsController {

    @Autowired
    private MatrimonioStatsService matrimonioStatsService;

    @GetMapping
    public MatrimonioStatsDTO getMatrimonioStats() {
        return matrimonioStatsService.getMatrimonioStats();
    }
}
