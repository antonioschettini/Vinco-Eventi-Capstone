package antonioschettini.backend.controllers;

import antonioschettini.backend.entities.ServiceEntity;
import antonioschettini.backend.recordsDTO.ServiceDTO;
import antonioschettini.backend.services.CloudinaryService;
import antonioschettini.backend.services.ServiceMgmtService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/services")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminServiceController {

    @Autowired
    private ServiceMgmtService serviceMgmtService;

    @Autowired
    private CloudinaryService cloudinaryService;

    @PostMapping
    public ResponseEntity<ServiceEntity> createService(@RequestBody @Valid ServiceDTO dto) {
        ServiceEntity created = serviceMgmtService.createService(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServiceEntity> updateService(
            @PathVariable UUID id,
            @RequestBody @Valid ServiceDTO dto) {
        ServiceEntity updated = serviceMgmtService.updateService(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteService(@PathVariable UUID id) {
        serviceMgmtService.deleteService(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/upload-image")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        String imageUrl = cloudinaryService.uploadImage(file);
        return ResponseEntity.ok(Map.of("url", imageUrl));
    }
}
