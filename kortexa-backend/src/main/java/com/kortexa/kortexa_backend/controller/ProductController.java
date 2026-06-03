package com.kortexa.kortexa_backend.controller;

import com.kortexa.kortexa_backend.dto.ProductRequest;
import com.kortexa.kortexa_backend.model.Product;
import com.kortexa.kortexa_backend.service.AiService;
import com.kortexa.kortexa_backend.service.ImageUploadService;
import com.kortexa.kortexa_backend.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
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

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createProduct(
            // 1. Grab the JSON text part and convert it to your DTO
            @Valid @RequestPart("product") ProductRequest request,

            // 2. Grab the actual image file part
            @RequestPart(value = "file", required = false) MultipartFile file,

            Authentication authentication
    ) {
        try {
            // authentication.getName() contains the email from the JWT Subject!
            // 3. Pass the 'file' into your service so Cloudinary can upload it
            Product product = productService.createProduct(request, file, authentication.getName());
            
            // Reload the products from db and update the cache so frontend sees the new product
            productService.getAllProducts();
            
            return ResponseEntity.ok(product);

        } catch (SecurityException | IllegalArgumentException e) {
            log.warn("Product creation denied for user={}: {}", authentication.getName(), e.getMessage());
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during product creation", e);
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to create product: " + e.getMessage()));
        }
    }

    // GET /api/products -> Public catalog of all products (Redis-cached via @Cacheable in ProductService)
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        log.debug("GET /api/products - fetching full product catalog (may be served from Redis cache)");
        return ResponseEntity.ok(productService.getAllProducts());
    }

    // GET /api/products/my-store -> Vendors can view only their own inventory
    @GetMapping("/my-store")
    public ResponseEntity<List<Product>> getMyProducts(Authentication authentication) {
        return ResponseEntity.ok(productService.getMyProducts(authentication.getName()));
    }

    @GetMapping("/store/categories")
    public ResponseEntity<List<String>> getStoreCategories() {
        return ResponseEntity.ok(productService.getStoreCategories());
    }

    @GetMapping("/store/featured")
    public ResponseEntity<Page<Product>> browseFeatured(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(productService.browseFeaturedProducts(page, size));
    }

    @GetMapping("/store")
    public ResponseEntity<Page<Product>> browseStore(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "48") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Page<Product> products = productService.browsePublicStore(
                search, category, minPrice, maxPrice, page, size, sortBy, sortDir);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/recently-viewed")
    public ResponseEntity<List<Product>> getRecentlyViewed(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName().equals("anonymousUser")) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        return ResponseEntity.ok(productService.getRecentlyViewedProducts(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(@PathVariable Long id, Authentication authentication) {
        try {
            String email = (authentication != null && authentication.isAuthenticated()) ? authentication.getName() : null;
            Product product = productService.getProductById(id, email);
            return ResponseEntity.ok(product);
        } catch (IllegalArgumentException e) {
            log.warn("Product not found: id={}", id);
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/frequently-bought-together")
    public ResponseEntity<List<Product>> getFrequentlyBoughtTogether(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getFrequentlyBoughtTogether(id));
    }

    // PUT /api/products/{id} -> Update product (vendor-protected)
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateProduct(
            @PathVariable Long id,
            @Valid @RequestPart("product") ProductRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file,
            Authentication authentication
    ) {
        try {
            Product product = productService.updateProduct(id, request, file, authentication.getName());
            productService.getAllProducts(); // Clear cache
            return ResponseEntity.ok(product);
        } catch (SecurityException | IllegalArgumentException e) {
            log.warn("Product update denied for user={}: {}", authentication.getName(), e.getMessage());
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during product update", e);
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to update product: " + e.getMessage()));
        }
    }

    // PATCH /api/products/{id}/stock -> Update stock quantity
    @PatchMapping("/{id}/stock")
    public ResponseEntity<?> updateStock(
            @PathVariable Long id,
            @RequestParam Integer quantity,
            Authentication authentication
    ) {
        try {
            Product product = productService.updateProductStock(id, quantity, authentication.getName());
            productService.getAllProducts(); // Clear cache
            return ResponseEntity.ok(product);
        } catch (SecurityException | IllegalArgumentException e) {
            log.warn("Stock update denied for user={}: {}", authentication.getName(), e.getMessage());
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during stock update", e);
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to update stock: " + e.getMessage()));
        }
    }
}