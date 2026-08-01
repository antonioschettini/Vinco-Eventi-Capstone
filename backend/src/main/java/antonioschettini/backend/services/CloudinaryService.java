package antonioschettini.backend.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.*;

@Service
public class CloudinaryService {

    // Soglia per il chunked upload: file > 90MB usano uploadLarge
    private static final long CHUNKED_UPLOAD_THRESHOLD = 90L * 1024 * 1024;

    @Autowired
    private Cloudinary cloudinary;

    public String uploadImage(MultipartFile file) throws IOException {
        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "folder", "vinco_eventi_servizi"
        ));
        return uploadResult.get("secure_url") != null ? uploadResult.get("secure_url").toString() : uploadResult.get("url").toString();
    }

    public String uploadMedia(MultipartFile file) throws IOException {
        Map<String, String> result = uploadMediaWithMetadata(file);
        return result.get("url");
    }

    public Map<String, String> uploadMediaWithMetadata(MultipartFile file) throws IOException {
        long fileSize = file.getSize();
        Map<?, ?> uploadResult;

        Map<String, Object> params = new HashMap<>();
        params.put("folder", "vinco_eventi_galleria");
        params.put("resource_type", "auto");
        // Eager transformations per Fast-Start video e formati ottimali web
        params.put("eager", Arrays.asList(
                "q_auto,f_auto,w_1080,c_limit",
                "q_auto,f_auto,w_720,c_limit",
                "f_jpg,q_auto,w_720,so_0"
        ));
        params.put("eager_async", false);

        if (fileSize > CHUNKED_UPLOAD_THRESHOLD) {
            String originalFilename = file.getOriginalFilename();
            String suffix = (originalFilename != null && originalFilename.contains("."))
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".tmp";

            File tempFile = File.createTempFile("vinco_upload_", suffix);
            try {
                try (InputStream inputStream = file.getInputStream()) {
                    Files.copy(inputStream, tempFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
                }
                params.put("chunk_size", 6 * 1024 * 1024);
                uploadResult = cloudinary.uploader().uploadLarge(tempFile, params);
            } finally {
                if (tempFile.exists()) {
                    tempFile.delete();
                }
            }
        } else {
            uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
        }

        String secureUrl = uploadResult.get("secure_url") != null ? uploadResult.get("secure_url").toString() : uploadResult.get("url").toString();
        String publicId = uploadResult.get("public_id") != null ? uploadResult.get("public_id").toString() : "";
        String resourceType = uploadResult.get("resource_type") != null ? uploadResult.get("resource_type").toString() : "image";

        String posterUrl = secureUrl;
        if ("video".equalsIgnoreCase(resourceType) || secureUrl.contains("/video/upload/")) {
            posterUrl = generatePosterUrlFromCloudinaryUrl(secureUrl);
        }

        return Map.of(
                "url", secureUrl,
                "publicId", publicId,
                "posterUrl", posterUrl,
                "resourceType", resourceType
        );
    }

    public void deleteMedia(String publicId, String resourceType, String fallbackUrl) {
        try {
            String targetPublicId = publicId;
            if (targetPublicId == null || targetPublicId.isBlank()) {
                targetPublicId = extractPublicIdFromUrl(fallbackUrl);
            }
            if (targetPublicId != null && !targetPublicId.isBlank()) {
                String type = (resourceType != null && !resourceType.isBlank()) ? resourceType : "image";
                cloudinary.uploader().destroy(targetPublicId, ObjectUtils.asMap("resource_type", type));
            }
        } catch (Exception e) {
            System.err.println("Impossibile eliminare la risorsa da Cloudinary: " + e.getMessage());
        }
    }

    public String generatePosterUrlFromCloudinaryUrl(String url) {
        if (url == null || !url.contains("res.cloudinary.com")) return url;
        int uploadIdx = url.indexOf("/upload/");
        if (uploadIdx == -1) return url;

        String prefix = url.substring(0, uploadIdx + 8);
        String rest = url.substring(uploadIdx + 8);

        String cleanRest = rest.replaceAll("\\.[^/.]+$", "");
        return prefix + "f_jpg,q_auto,w_720,so_0/" + cleanRest + ".jpg";
    }

    public String extractPublicIdFromUrl(String url) {
        if (url == null || !url.contains("res.cloudinary.com")) return null;
        int uploadIdx = url.indexOf("/upload/");
        if (uploadIdx == -1) return null;

        String rest = url.substring(uploadIdx + 8);
        String[] parts = rest.split("/");
        List<String> idParts = new ArrayList<>();
        for (String part : parts) {
            if (part.contains(",") || (part.contains("_") && !part.startsWith("v1") && !part.startsWith("v2") && !part.startsWith("vinco_"))) {
                continue;
            }
            if (part.matches("^v\\d+$")) {
                continue;
            }
            idParts.add(part);
        }
        String joined = String.join("/", idParts);
        return joined.replaceAll("\\.[^/.]+$", "");
    }
}
