package antonioschettini.backend.services;

import antonioschettini.backend.exceptions.BadRequestException;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
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
            throw new BadRequestException("Tipo file non supportato per le immagini. Usa JPEG, PNG, WebP o GIF.");
        }
        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "vinco_eventi_servizi",
                    "quality", "auto",
                    "fetch_format", "auto"
            ));
            return uploadResult.get("secure_url") != null ? uploadResult.get("secure_url").toString() : uploadResult.get("url").toString();
        } catch (Exception e) {
            System.err.println("Upload Cloudinary non riuscito: " + e.getMessage() + ". Utilizzo del fallback di salvataggio locale.");
            Map<String, String> localResult = saveLocally(file, "vinco_eventi_servizi");
            return localResult.get("url");
        }
    }

    public Map<String, String> uploadContractPdf(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "contratto.pdf";
        String contentType = file.getContentType();
        if (contentType != null && !contentType.toLowerCase().contains("pdf") && !filename.toLowerCase().endsWith(".pdf")) {
            throw new BadRequestException("Tipo file non supportato per i contratti. Caricare solo file PDF.");
        }
        try {
            String cleanName = filename.replaceAll("[^a-zA-Z0-9._-]", "_");
            if (!cleanName.toLowerCase().endsWith(".pdf")) {
                cleanName += ".pdf";
            }
            String publicId = "vinco_eventi_contratti/contratto_" + UUID.randomUUID().toString().substring(0, 8) + "_" + cleanName;

            Map<String, Object> params = new HashMap<>();
            params.put("public_id", publicId);
            params.put("resource_type", "raw");

            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
            String secureUrl = uploadResult.get("secure_url") != null ? uploadResult.get("secure_url").toString() : uploadResult.get("url").toString();
            String resPublicId = uploadResult.get("public_id") != null ? uploadResult.get("public_id").toString() : publicId;

            return Map.of(
                    "url", secureUrl,
                    "publicId", resPublicId,
                    "filename", filename
            );
        } catch (Exception e) {
            System.err.println("Upload Cloudinary contratto non riuscito: " + e.getMessage() + ". Salvataggio locale in fallback.");
            Map<String, String> localResult = saveLocally(file, "vinco_eventi_contratti");
            return Map.of(
                    "url", localResult.get("url"),
                    "publicId", "",
                    "filename", filename
            );
        }
    }

    public byte[] downloadContractPdf(String publicId, String fallbackUrl) throws IOException {
        String targetPublicId = publicId;
        if (targetPublicId == null || targetPublicId.isBlank()) {
            targetPublicId = extractPublicIdFromUrl(fallbackUrl);
        }

        if (targetPublicId != null && !targetPublicId.isBlank()) {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            // 1. Tenta con privateDownload (resource_type: raw)
            try {
                if (cloudinary != null) {
                    String downloadUrl = cloudinary.privateDownload(targetPublicId, "", ObjectUtils.asMap(
                            "resource_type", "raw",
                            "type", "upload"
                    ));

                    if (downloadUrl != null && !downloadUrl.isBlank()) {
                        HttpRequest req = HttpRequest.newBuilder()
                                .uri(URI.create(downloadUrl))
                                .timeout(Duration.ofSeconds(20))
                                .GET()
                                .build();
                        HttpResponse<byte[]> res = client.send(req, HttpResponse.BodyHandlers.ofByteArray());
                        if (res.statusCode() == 200 && res.body() != null && res.body().length > 0) {
                            return res.body();
                        }
                    }
                }
            } catch (Exception ex) {
                System.err.println("[WARN CloudinaryService] Download via privateDownload raw: " + ex.getMessage());
            }

            // 2. Tenta con privateDownload (resource_type: image)
            try {
                if (cloudinary != null) {
                    String downloadUrl = cloudinary.privateDownload(targetPublicId, "pdf", ObjectUtils.asMap(
                            "resource_type", "image",
                            "type", "upload"
                    ));

                    if (downloadUrl != null && !downloadUrl.isBlank()) {
                        HttpRequest req = HttpRequest.newBuilder()
                                .uri(URI.create(downloadUrl))
                                .timeout(Duration.ofSeconds(20))
                                .GET()
                                .build();
                        HttpResponse<byte[]> res = client.send(req, HttpResponse.BodyHandlers.ofByteArray());
                        if (res.statusCode() == 200 && res.body() != null && res.body().length > 0) {
                            return res.body();
                        }
                    }
                }
            } catch (Exception ex) {
                System.err.println("[WARN CloudinaryService] Download via privateDownload image: " + ex.getMessage());
            }

            // 3. Tenta con signed URL
            try {
                if (cloudinary != null && cloudinary.url() != null) {
                    String downloadUrl = cloudinary.url()
                            .resourceType("raw")
                            .type("upload")
                            .signed(true)
                            .generate(targetPublicId);

                    if (downloadUrl != null && !downloadUrl.isBlank()) {
                        HttpRequest req = HttpRequest.newBuilder()
                                .uri(URI.create(downloadUrl))
                                .timeout(Duration.ofSeconds(20))
                                .GET()
                                .build();
                        HttpResponse<byte[]> res = client.send(req, HttpResponse.BodyHandlers.ofByteArray());
                        if (res.statusCode() == 200 && res.body() != null && res.body().length > 0) {
                            return res.body();
                        }
                    }
                }
            } catch (Exception ex) {
                // ignore
            }

            // 4. Tenta con secure_url diretto se fallbackUrl è presente
            if (fallbackUrl != null && fallbackUrl.startsWith("http")) {
                try {
                    HttpRequest req = HttpRequest.newBuilder()
                            .uri(URI.create(fallbackUrl))
                            .timeout(Duration.ofSeconds(15))
                            .GET()
                            .build();
                    HttpResponse<byte[]> res = client.send(req, HttpResponse.BodyHandlers.ofByteArray());
                    if (res.statusCode() == 200 && res.body() != null && res.body().length > 0) {
                        return res.body();
                    }
                } catch (Exception ex) {
                    // ignore
                }
            }
        }

        // 5. Fallback locale se presente in uploads
        if (fallbackUrl != null && fallbackUrl.contains("uploads")) {
            try {
                String relative = fallbackUrl.substring(fallbackUrl.indexOf("uploads"));
                java.nio.file.Path localPath = java.nio.file.Paths.get(relative);
                if (Files.exists(localPath)) {
                    return Files.readAllBytes(localPath);
                }
            } catch (Exception ex) {
                // ignore
            }
        }

        throw new BadRequestException("Impossibile recuperare il file PDF del contratto.");
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
            throw new BadRequestException("Tipo file non supportato. Usa immagini (JPEG, PNG, WebP) o video (MP4, MOV, WebM).");
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

            if (!isVideo) {
                params.put("quality", "auto");
                params.put("fetch_format", "auto");
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
            e.printStackTrace();
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
                Map<?, ?> result = cloudinary.uploader().destroy(targetPublicId, ObjectUtils.asMap("resource_type", type));
                
                // Se la prima distruzione restituisce not_found, tenta con tipo alternativo e varianti con/senza estensione .pdf
                if ("not_found".equalsIgnoreCase(String.valueOf(result.get("result")))) {
                    String altType = "raw".equalsIgnoreCase(type) ? "image" : ("image".equalsIgnoreCase(type) ? "raw" : "video");
                    Map<?, ?> altResult = cloudinary.uploader().destroy(targetPublicId, ObjectUtils.asMap("resource_type", altType));
                    
                    if ("not_found".equalsIgnoreCase(String.valueOf(altResult.get("result")))) {
                        String targetWithExt = targetPublicId.toLowerCase().endsWith(".pdf") ? targetPublicId : (targetPublicId + ".pdf");
                        String targetWithoutExt = targetPublicId.toLowerCase().endsWith(".pdf") ? targetPublicId.substring(0, targetPublicId.length() - 4) : targetPublicId;
                        
                        cloudinary.uploader().destroy(targetWithExt, ObjectUtils.asMap("resource_type", "raw"));
                        cloudinary.uploader().destroy(targetWithoutExt, ObjectUtils.asMap("resource_type", "raw"));
                        cloudinary.uploader().destroy(targetWithExt, ObjectUtils.asMap("resource_type", "image"));
                    }
                }
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

        boolean isRaw = url.contains("/raw/upload/");
        String rest = url.substring(uploadIdx + 8);
        String[] parts = rest.split("/");
        List<String> idParts = new ArrayList<>();
        for (String part : parts) {
            if (part.contains(",") || (part.contains("_") && !part.startsWith("v1") && !part.startsWith("v2") && !part.startsWith("vinco_") && !part.startsWith("contratto_"))) {
                continue;
            }
            if (part.matches("^v\\d+$")) {
                continue;
            }
            idParts.add(part);
        }
        String joined = String.join("/", idParts);
        if (isRaw || joined.toLowerCase().endsWith(".pdf")) {
            return joined;
        }
        return joined.replaceAll("\\.[^/.]+$", "");
    }
}
