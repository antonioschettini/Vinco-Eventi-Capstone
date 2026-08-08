package antonioschettini.backend;

import antonioschettini.backend.entities.GalleryItem;
import antonioschettini.backend.exceptions.NotFoundException;
import antonioschettini.backend.recordsDTO.GalleryDTO;
import antonioschettini.backend.repositories.GalleryRepository;
import antonioschettini.backend.services.CloudinaryService;
import antonioschettini.backend.services.GalleryMgmtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class GalleryMgmtServiceTest {

    @Mock
    private GalleryRepository galleryRepository;

    @Mock
    private CloudinaryService cloudinaryService;

    @InjectMocks
    private GalleryMgmtService galleryMgmtService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testGetAllGalleryItems() {
        GalleryItem item1 = GalleryItem.builder().id(UUID.randomUUID()).titleIta("Foto 1").displayOrder(1).build();
        GalleryItem item2 = GalleryItem.builder().id(UUID.randomUUID()).titleIta("Foto 2").displayOrder(2).build();

        when(galleryRepository.findAllByOrderByDisplayOrderAscCreatedAtDesc()).thenReturn(List.of(item1, item2));

        List<GalleryItem> result = galleryMgmtService.getAllGalleryItems();

        assertEquals(2, result.size());
        assertEquals("Foto 1", result.get(0).getTitleIta());
    }

    @Test
    void testGetGalleryItemByIdNotFoundThrowsException() {
        UUID id = UUID.randomUUID();
        when(galleryRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> galleryMgmtService.getGalleryItemById(id));
    }

    @Test
    void testCreateGalleryItemVideoGeneratesPosterUrl() {
        GalleryDTO dto = new GalleryDTO(
                "Video Evento",
                "Event Video",
                "Sottotitolo ITA",
                "Subtitle ENG",
                "video",
                "https://res.cloudinary.com/demo/video/upload/v1234/sample.mp4",
                "weddings",
                true,
                15.0,
                1,
                null,
                null
        );

        when(cloudinaryService.generatePosterUrlFromCloudinaryUrl(dto.src()))
                .thenReturn("https://res.cloudinary.com/demo/video/upload/f_jpg,q_auto,w_720,so_0/v1234/sample.jpg");
        when(cloudinaryService.extractPublicIdFromUrl(dto.src())).thenReturn("vinco_eventi_galleria/sample");
        when(galleryRepository.save(any(GalleryItem.class))).thenAnswer(inv -> inv.getArgument(0));

        GalleryItem created = galleryMgmtService.createGalleryItem(dto);

        assertNotNull(created);
        assertEquals("video", created.getType());
        assertEquals("https://res.cloudinary.com/demo/video/upload/f_jpg,q_auto,w_720,so_0/v1234/sample.jpg", created.getPosterUrl());
        assertEquals("vinco_eventi_galleria/sample", created.getPublicId());
    }

    @Test
    void testDeleteGalleryItemDeletesFromCloudinaryAndRepository() {
        UUID id = UUID.randomUUID();
        GalleryItem item = GalleryItem.builder()
                .id(id)
                .titleIta("Foto da eliminare")
                .type("image")
                .src("https://res.cloudinary.com/demo/image/upload/v1234/photo.jpg")
                .publicId("photo_public_id")
                .build();

        when(galleryRepository.findById(id)).thenReturn(Optional.of(item));

        galleryMgmtService.deleteGalleryItem(id);

        verify(cloudinaryService).deleteMedia("photo_public_id", "image", "https://res.cloudinary.com/demo/image/upload/v1234/photo.jpg");
        verify(galleryRepository).delete(item);
    }
}
