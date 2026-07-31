package antonioschettini.backend.controllers;

import antonioschettini.backend.entities.ServiceEntity;
import antonioschettini.backend.services.ServiceMgmtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/services")
public class ServiceController {

    @Autowired
    private ServiceMgmtService serviceMgmtService;

    @GetMapping
    public ResponseEntity<List<ServiceEntity>> getAllServices() {
        List<ServiceEntity> services = serviceMgmtService.getAllServices();
        return ResponseEntity.ok(services);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceEntity> getServiceById(@PathVariable UUID id) {
        ServiceEntity service = serviceMgmtService.getServiceById(id);
        return ResponseEntity.ok(service);
    }
}
