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
        String contentType = file.getContentType();
        List<String> allowedImageTypes = List.of("image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml");
        if (contentType == null || !allowedImageTypes.contains(contentType.toLowerCase())) {
            throw new RuntimeException("Tipo file non supportato per le immagini. Usa JPEG, PNG, WebP o GIF.");
        }
        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "vinco_eventi_servizi"
            ));
            return uploadResult.get("secure_url") != null ? uploadResult.get("secure_url").toString() : uploadResult.get("url").toString();
        } catch (Exception e) {
            System.err.println("Upload Cloudinary non riuscito: " + e.getMessage() + ". Utilizzo del fallback di salvataggio locale.");
            Map<String, String> localResult = saveLocally(file, "vinco_eventi_servizi");
            return localResult.get("url");
        }
    }

    public String uploadMedia(MultipartFile file) throws IOException {
        Map<String, String> result = uploadMediaWithMetadata(file);
        return result.get("url");
    }

    public Map<String, String> uploadMediaWithMetadata(MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        List<String> allowedMediaTypes = List.of(
                "image/jpeg", "image/png", "image/webp", "image/gif",
                "video/mp4", "video/quicktime", "video/webm", "video/x-msvideo", "video/x-matroska"
        );
        if (contentType == null || !allowedMediaTypes.contains(contentType.toLowerCase())) {
            throw new RuntimeException("Tipo file non supportato. Usa immagini (JPEG, PNG, WebP) o video (MP4, MOV, WebM).");
        }
        try {
            long fileSize = file.getSize();
            Map<?, ?> uploadResult;

            String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
            boolean isVideo = (contentType != null && contentType.startsWith("video")) ||
                    filename.endsWith(".mp4") || filename.endsWith(".webm") || filename.endsWith(".mov") || filename.endsWith(".avi") || filename.endsWith(".mkv");

            Map<String, Object> params = new HashMap<>();
            params.put("folder", "vinco_eventi_galleria");
            params.put("resource_type", isVideo ? "video" : "auto");
            params.put("eager_async", false);

            if (isVideo) {
                params.put("eager", Arrays.asList(
                        "q_auto,f_auto,w_1080,c_limit",
                        "q_auto,f_auto,w_720,c_limit",
                        "f_jpg,q_auto,w_720,so_0"
                ));
            } else {
                params.put("eager", Arrays.asList(
                        "q_auto,f_auto,w_1080,c_limit",
                        "q_auto,f_auto,w_720,c_limit"
                ));
            }

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
            String resourceType = uploadResult.get("resource_type") != null ? uploadResult.get("resource_type").toString() : (isVideo ? "video" : "image");

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
        } catch (Exception e) {
            System.err.println("Upload Cloudinary multimediale fallito: " + e.getMessage() + ". Utilizzo del fallback di salvataggio locale.");
            return saveLocally(file, "vinco_eventi_galleria");
        }
    }

    private Map<String, String> saveLocally(MultipartFile file, String folder) {
        try {
            String originalFilename = file.getOriginalFilename();
            String ext = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                ext = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String fileName = UUID.randomUUID().toString() + ext;
            java.nio.file.Path uploadPath = java.nio.file.Paths.get("uploads", folder);
            Files.createDirectories(uploadPath);
            java.nio.file.Path targetPath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String localUrl = "/uploads/" + folder + "/" + fileName;
            String contentType = file.getContentType();
            String resourceType = (contentType != null && contentType.startsWith("video")) ? "video" : "image";

            return Map.of(
                    "url", localUrl,
                    "publicId", "",
                    "posterUrl", localUrl,
                    "resourceType", resourceType
            );
        } catch (IOException ex) {
            throw new RuntimeException("Errore durante il salvataggio locale del file", ex);
        }
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
