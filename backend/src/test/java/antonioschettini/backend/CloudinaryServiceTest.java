package antonioschettini.backend;

import antonioschettini.backend.exceptions.BadRequestException;
import antonioschettini.backend.services.CloudinaryService;
import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CloudinaryServiceTest {

    @Mock
    private Cloudinary cloudinary;

    @Mock
    private Uploader uploader;

    @InjectMocks
    private CloudinaryService cloudinaryService;

    @BeforeEach
    void setUp() {
        // No network calls made to preserve Cloudinary free tier quota 100%
    }

    @Test
    void testUploadImageSuccess() throws IOException {
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap())).thenReturn(Map.of(
                "secure_url", "https://res.cloudinary.com/demo/image/upload/v1/vinco_sample.webp",
                "public_id", "vinco_eventi_servizi/sample123"
        ));

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "photo.webp",
                "image/webp",
                "dummy image content".getBytes()
        );

        String url = cloudinaryService.uploadImage(file);
        assertNotNull(url);
        assertTrue(url.contains("cloudinary.com"));
        verify(uploader, times(1)).upload(any(byte[].class), anyMap());
    }

    @Test
    void testUploadImageInvalidTypeThrowsBadRequest() {
        MockMultipartFile invalidFile = new MockMultipartFile(
                "file",
                "malicious.exe",
                "application/octet-stream",
                "malicious payload".getBytes()
        );

        assertThrows(BadRequestException.class, () -> cloudinaryService.uploadImage(invalidFile));
        verifyNoInteractions(cloudinary);
    }

    @Test
    void testUploadContractPdfSuccess() throws IOException {
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap())).thenReturn(Map.of(
                "secure_url", "https://res.cloudinary.com/demo/raw/upload/v1/contratto_123.pdf",
                "public_id", "vinco_eventi_contratti/contratto_123"
        ));

        MockMultipartFile pdfFile = new MockMultipartFile(
                "file",
                "contratto_firmato.pdf",
                "application/pdf",
                "%PDF-1.4 dummy pdf bytes".getBytes()
        );

        Map<String, String> result = cloudinaryService.uploadContractPdf(pdfFile);
        assertNotNull(result);
        assertEquals("https://res.cloudinary.com/demo/raw/upload/v1/contratto_123.pdf", result.get("url"));
        assertEquals("contratto_firmato.pdf", result.get("filename"));
    }

    @Test
    void testUploadContractPdfInvalidTypeThrowsBadRequest() {
        MockMultipartFile txtFile = new MockMultipartFile(
                "file",
                "readme.txt",
                "text/plain",
                "This is not a pdf".getBytes()
        );

        assertThrows(BadRequestException.class, () -> cloudinaryService.uploadContractPdf(txtFile));
        verifyNoInteractions(cloudinary);
    }

    @Test
    void testUploadMediaVideoMetadataGeneration() throws IOException {
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap())).thenReturn(Map.of(
                "secure_url", "https://res.cloudinary.com/demo/video/upload/v12345/vinco_eventi_galleria/sample.mp4",
                "public_id", "vinco_eventi_galleria/sample",
                "resource_type", "video"
        ));

        MockMultipartFile videoFile = new MockMultipartFile(
                "file",
                "highlight.mp4",
                "video/mp4",
                "dummy mp4 bytes".getBytes()
        );

        Map<String, String> metadata = cloudinaryService.uploadMediaWithMetadata(videoFile);
        assertNotNull(metadata);
        assertEquals("video", metadata.get("resourceType"));
        assertTrue(metadata.get("posterUrl").contains(".webp") || metadata.get("posterUrl").contains(".jpg") || metadata.get("posterUrl").contains("upload"));
    }

    @Test
    void testDownloadContractPdfThrowsBadRequestWhenNotFound() {
        assertThrows(BadRequestException.class, () ->
                cloudinaryService.downloadContractPdf("non_existent_id", "invalid_url"));
    }
}
