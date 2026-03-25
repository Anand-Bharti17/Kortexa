package com.kortexa.kortexa_backend.controller;

import com.kortexa.kortexa_backend.dto.ProductRequest;
import com.kortexa.kortexa_backend.model.Product;
import com.kortexa.kortexa_backend.service.AiService;
import com.kortexa.kortexa_backend.service.ImageUploadService;
import com.kortexa.kortexa_backend.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final AiService aiService; // Add this to your constructor/RequiredArgsConstructor
    // Add this to your dependencies at the top
    private final ImageUploadService imageUploadService;

    // Add this new endpoint
    @PostMapping("/upload-image")
    public ResponseEntity<Map<String, String>> uploadProductImage(@RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = imageUploadService.uploadImage(file);
            return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
        } catch (IOException e) {
            log.error("Product image upload failed for file='{}': {}", file.getOriginalFilename(), e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to upload image"));
        }
    }

    @GetMapping("/generate-description")
    public ResponseEntity<Map<String, String>> suggestDescription(
            @RequestParam String name,
            @RequestParam String category) {

        String description = aiService.generateProductDescription(name, category);
        return ResponseEntity.ok(Map.of("suggestedDescription", description));
    }

    // POST /api/products -> Creates a new product
    @PostMapping
    public ResponseEntity<?> createProduct(
            @Valid @RequestBody ProductRequest request,
            Authentication authentication
    ) {
        try {
            // authentication.getName() contains the email from the JWT Subject!
            Product product = productService.createProduct(request, authentication.getName());
            return ResponseEntity.ok(product);
        } catch (SecurityException | IllegalArgumentException e) {
            log.warn("Product creation denied for user={}: {}", authentication.getName(), e.getMessage());
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/products -> Public catalog of all products
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    // GET /api/products/my-store -> Vendors can view only their own inventory
    @GetMapping("/my-store")
    public ResponseEntity<List<Product>> getMyProducts(Authentication authentication) {
        return ResponseEntity.ok(productService.getMyProducts(authentication.getName()));
    }

    @GetMapping("/store")
    public ResponseEntity<Page<Product>> browseStore(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy) {

        Page<Product> products = productService.browsePublicStore(search, category, minPrice, maxPrice, page, size, sortBy);
        return ResponseEntity.ok(products);
    }
}