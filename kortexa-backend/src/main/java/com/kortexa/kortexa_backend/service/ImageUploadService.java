package com.kortexa.kortexa_backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageUploadService {

    private final Cloudinary cloudinary;

    private static final long MAX_BYTES = 5 * 1024 * 1024;

    public String uploadImage(MultipartFile file) throws IOException {
        log.info("Image upload request received: filename='{}', size={} bytes", file.getOriginalFilename(), file.getSize());

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new IllegalArgumentException("Image must be 5 MB or smaller");
        }

        String contentType = file.getContentType();
        if (contentType == null
                || !(contentType.equals("image/jpeg")
                || contentType.equals("image/png")
                || contentType.equals("image/webp")
                || contentType.equals("image/gif"))) {
            throw new IllegalArgumentException("Only JPEG, PNG, WebP, or GIF images are allowed");
        }

        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
            String secureUrl = uploadResult.get("secure_url").toString();
            log.info("Image uploaded successfully: url={}", secureUrl);
            // Return the secure (https) URL of the uploaded image
            return secureUrl;
        } catch (IOException e) {
            log.error("Image upload failed for file='{}': {}", file.getOriginalFilename(), e.getMessage(), e);
            throw e;
        }
    }
}