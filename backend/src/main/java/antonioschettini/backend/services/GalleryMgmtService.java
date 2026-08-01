package antonioschettini.backend.services;

import antonioschettini.backend.entities.GalleryItem;
import antonioschettini.backend.exceptions.NotFoundException;
import antonioschettini.backend.recordsDTO.GalleryDTO;
import antonioschettini.backend.repositories.GalleryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class GalleryMgmtService {

    @Autowired
    private GalleryRepository galleryRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    public List<GalleryItem> getAllGalleryItems() {
        return galleryRepository.findAllByOrderByDisplayOrderAscCreatedAtDesc();
    }

    public GalleryItem getGalleryItemById(UUID id) {
        return galleryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Elemento multimediale della galleria con ID " + id + " non trovato"));
    }

    public GalleryItem createGalleryItem(GalleryDTO dto) {
        String posterUrl = dto.posterUrl();
        if ("video".equalsIgnoreCase(dto.type()) && (posterUrl == null || posterUrl.isBlank()) && dto.src() != null) {
            posterUrl = cloudinaryService.generatePosterUrlFromCloudinaryUrl(dto.src());
        }

        String publicId = dto.publicId();
        if ((publicId == null || publicId.isBlank()) && dto.src() != null) {
            publicId = cloudinaryService.extractPublicIdFromUrl(dto.src());
        }

        GalleryItem item = GalleryItem.builder()
                .titleIta(dto.titleIta())
                .titleEng(dto.titleEng())
                .subtitleIta(dto.subtitleIta())
                .subtitleEng(dto.subtitleEng())
                .type(dto.type())
                .src(dto.src())
                .category(dto.category() != null ? dto.category() : "djset")
                .featured(dto.featured() != null ? dto.featured() : false)
                .startTime(dto.startTime())
                .displayOrder(dto.displayOrder() != null ? dto.displayOrder() : 1)
                .publicId(publicId)
                .posterUrl(posterUrl)
                .build();

        return galleryRepository.save(item);
    }

    public GalleryItem updateGalleryItem(UUID id, GalleryDTO dto) {
        GalleryItem existing = getGalleryItemById(id);

        existing.setTitleIta(dto.titleIta());
        existing.setTitleEng(dto.titleEng());
        existing.setSubtitleIta(dto.subtitleIta());
        existing.setSubtitleEng(dto.subtitleEng());
        existing.setType(dto.type());
        existing.setSrc(dto.src());

        if (dto.category() != null) {
            existing.setCategory(dto.category());
        }
        if (dto.featured() != null) {
            existing.setFeatured(dto.featured());
        }
        existing.setStartTime(dto.startTime());
        if (dto.displayOrder() != null) {
            existing.setDisplayOrder(dto.displayOrder());
        }

        String publicId = dto.publicId() != null ? dto.publicId() : cloudinaryService.extractPublicIdFromUrl(dto.src());
        String posterUrl = dto.posterUrl();
        if ("video".equalsIgnoreCase(dto.type()) && (posterUrl == null || posterUrl.isBlank()) && dto.src() != null) {
            posterUrl = cloudinaryService.generatePosterUrlFromCloudinaryUrl(dto.src());
        }

        existing.setPublicId(publicId);
        existing.setPosterUrl(posterUrl);

        return galleryRepository.save(existing);
    }

    public void deleteGalleryItem(UUID id) {
        GalleryItem existing = getGalleryItemById(id);
        
        // Cancellazione fisica dell'asset multimediale da Cloudinary se presente
        cloudinaryService.deleteMedia(existing.getPublicId(), existing.getType(), existing.getSrc());
        
        galleryRepository.delete(existing);
    }
}
