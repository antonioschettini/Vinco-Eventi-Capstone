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
import java.util.Map;

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
        long fileSize = file.getSize();

        if (fileSize > CHUNKED_UPLOAD_THRESHOLD) {
            // File grande: usa upload chunked (uploadLarge) per bypassare il limite Cloudinary
            return uploadLargeMedia(file);
        } else {
            // File piccolo: upload diretto standard
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "vinco_eventi_galleria",
                    "resource_type", "auto"
            ));
            return uploadResult.get("secure_url") != null ? uploadResult.get("secure_url").toString() : uploadResult.get("url").toString();
        }
    }

    private String uploadLargeMedia(MultipartFile multipartFile) throws IOException {
        // uploadLarge richiede un File fisico (non byte array) — creiamo un file temporaneo
        String originalFilename = multipartFile.getOriginalFilename();
        String suffix = (originalFilename != null && originalFilename.contains("."))
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".tmp";

        File tempFile = File.createTempFile("vinco_upload_", suffix);
        try {
            try (InputStream inputStream = multipartFile.getInputStream()) {
                Files.copy(inputStream, tempFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
            }

            // Chunk size: 6MB (default raccomandato da Cloudinary)
            int chunkSize = 6 * 1024 * 1024;
            Map<?, ?> uploadResult = cloudinary.uploader().uploadLarge(tempFile, ObjectUtils.asMap(
                    "folder", "vinco_eventi_galleria",
                    "resource_type", "auto",
                    "chunk_size", chunkSize
            ));
            return uploadResult.get("secure_url") != null ? uploadResult.get("secure_url").toString() : uploadResult.get("url").toString();
        } finally {
            // Pulizia del file temporaneo
            if (tempFile.exists()) {
                tempFile.delete();
            }
        }
    }
}

