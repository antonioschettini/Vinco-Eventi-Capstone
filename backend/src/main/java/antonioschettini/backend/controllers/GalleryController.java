package antonioschettini.backend.controllers;

import antonioschettini.backend.entities.GalleryItem;
import antonioschettini.backend.services.GalleryMgmtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/gallery")
public class GalleryController {

    @Autowired
    private GalleryMgmtService galleryMgmtService;

    @GetMapping
    public ResponseEntity<List<GalleryItem>> getAllGalleryItems() {
        List<GalleryItem> items = galleryMgmtService.getAllGalleryItems();
        return ResponseEntity.ok(items);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GalleryItem> getGalleryItemById(@PathVariable UUID id) {
        GalleryItem item = galleryMgmtService.getGalleryItemById(id);
        return ResponseEntity.ok(item);
    }
}
