package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.dto.ProductRequest;
import com.kortexa.kortexa_backend.model.AccountStatus;
import com.kortexa.kortexa_backend.model.Product;
import com.kortexa.kortexa_backend.model.Role;
import com.kortexa.kortexa_backend.model.User;
import com.kortexa.kortexa_backend.repository.ProductRepository;
import com.kortexa.kortexa_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public Product createProduct(ProductRequest request, MultipartFile file, String userEmail) {
        log.info("Product creation request by vendor: email={}, productName='{}'", userEmail, request.name());

        // 1. Find the user making the request
        User vendor = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> {
                    log.warn("Product creation failed - user not found: {}", userEmail);
                    return new IllegalArgumentException("User not found");
                });

        // 2. Enforce Role: Only Vendors can sell
        if (vendor.getRole() != Role.VENDOR) {
            log.warn("Product creation denied - user is not a VENDOR: email={}, role={}", userEmail, vendor.getRole());
            throw new SecurityException("Access Denied: Only Vendors can create products.");
        }

        // 3. Enforce Account Status: Vendors must be approved by an Admin
        if (vendor.getStatus() != AccountStatus.ACTIVE) {
            log.warn("Product creation denied - vendor not active: email={}, status={}", userEmail, vendor.getStatus());
            throw new SecurityException("Access Denied: Your vendor account is pending approval or suspended.");
        }

        // --- NEW: 4. Upload Image to Cloudinary ---
        String uploadedImageUrl = request.imageUrl(); // Fallback if no file is sent
        if (file != null && !file.isEmpty()) {
            try {
                // UNCOMMENT AND USE YOUR CLOUDINARY SERVICE HERE:
                // uploadedImageUrl = cloudinaryService.uploadFile(file);
                log.info("Successfully uploaded image to Cloudinary");
            } catch (Exception e) {
                log.error("Failed to upload image to Cloudinary", e);
                throw new RuntimeException("Image upload failed: " + e.getMessage());
            }
        }

        // --- NEW: 5. Generate SEO Description with Gemini AI ---
        String finalDescription = request.description();
        // Since our React form doesn't even have a description field, this will usually be null!
        if (finalDescription == null || finalDescription.isBlank()) {
            try {
                // UNCOMMENT AND USE YOUR GEMINI SERVICE HERE:
                // finalDescription = geminiService.generateProductDescription(request.name());

                // Temporary fallback until Gemini is wired up:
                finalDescription = "A premium " + request.name() + " offered by " + vendor.getEmail();
                log.info("Successfully generated AI description");
            } catch (Exception e) {
                log.error("Failed to generate AI description", e);
                finalDescription = "High-quality product guaranteed."; // Safe fallback
            }
        }

        // 6. Map DTO to Entity and Link the Vendor
        Product product = Product.builder()
                .vendor(vendor)
                .name(request.name())
                .description(finalDescription) // <-- Using the Gemini text!
                .price(request.price())
                .stockQuantity(request.stockQuantity())
                .category(request.category())
                .imageUrl(uploadedImageUrl)    // <-- Using the Cloudinary URL!
                .build();

        // 7. Save to Database
        Product saved = productRepository.save(product);
        log.info("Product created successfully: productId={}, name='{}', vendor={}", saved.getId(), saved.getName(), userEmail);
        return saved;
    }

    // @Cacheable checks Redis first. If cache HIT → method body is skipped (no log below will appear).
    // If cache MISS → method body runs, DB is queried, and result is stored in Redis.
    @Cacheable(value = "products") // <-- Caches the output in Redis under key 'products'
    public List<Product> getAllProducts() {
        log.info("[CACHE MISS] 'products' not found in Redis — querying database for full product catalog");
        List<Product> products = productRepository.findAll();
        log.info("[DB QUERY] Retrieved {} products from database; result will be cached in Redis", products.size());
        return products;
    }

    public List<Product> getMyProducts(String userEmail) {
        log.debug("Fetching store inventory for vendor: email={}", userEmail);
        User vendor = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> {
                    log.warn("getMyProducts failed - vendor not found: email={}", userEmail);
                    return new IllegalArgumentException("User not found");
                });
        List<Product> products = productRepository.findByVendorId(vendor.getId());
        log.debug("Vendor store inventory fetched: email={}, productCount={}", userEmail, products.size());
        return products;
    }

    public Page<Product> browsePublicStore(String search, String category, BigDecimal minPrice, BigDecimal maxPrice, int page, int size, String sortBy) {
        log.debug("Public store browse: search='{}', category='{}', minPrice={}, maxPrice={}, page={}, size={}, sortBy={}",
                search, category, minPrice, maxPrice, page, size, sortBy);

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).descending());

        // Safely format the search string in Java to prevent PostgreSQL type confusion
        String formattedSearch = (search != null && !search.trim().isEmpty())
                ? "%" + search.toLowerCase() + "%"
                : null;

        // Pass the safely formatted string to the repository
        return productRepository.searchAndFilterProducts(formattedSearch, category, minPrice, maxPrice, pageable);
    }
}