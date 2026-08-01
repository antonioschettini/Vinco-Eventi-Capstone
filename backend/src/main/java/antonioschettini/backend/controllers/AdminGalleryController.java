package antonioschettini.backend.controllers;

import antonioschettini.backend.entities.GalleryItem;
import antonioschettini.backend.recordsDTO.GalleryDTO;
import antonioschettini.backend.services.CloudinaryService;
import antonioschettini.backend.services.GalleryMgmtService;
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
@RequestMapping("/api/admin/gallery")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminGalleryController {

    @Autowired
    private GalleryMgmtService galleryMgmtService;

    @Autowired
    private CloudinaryService cloudinaryService;

    @PostMapping
    public ResponseEntity<GalleryItem> createGalleryItem(@RequestBody @Valid GalleryDTO dto) {
        GalleryItem created = galleryMgmtService.createGalleryItem(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GalleryItem> updateGalleryItem(
            @PathVariable UUID id,
            @RequestBody @Valid GalleryDTO dto) {
        GalleryItem updated = galleryMgmtService.updateGalleryItem(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGalleryItem(@PathVariable UUID id) {
        galleryMgmtService.deleteGalleryItem(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/upload-media")
    public ResponseEntity<Map<String, String>> uploadMedia(@RequestParam("file") MultipartFile file) throws IOException {
        String mediaUrl = cloudinaryService.uploadMedia(file);
        return ResponseEntity.ok(Map.of("url", mediaUrl));
    }
}
