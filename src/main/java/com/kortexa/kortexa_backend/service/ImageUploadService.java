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

    public String uploadImage(MultipartFile file) throws IOException {
        log.info("Image upload request received: filename='{}', size={} bytes", file.getOriginalFilename(), file.getSize());
        // Upload the file and let Cloudinary auto-detect the file type
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