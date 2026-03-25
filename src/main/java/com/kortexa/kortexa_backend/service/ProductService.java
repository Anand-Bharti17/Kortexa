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
import java.math.BigDecimal;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public Product createProduct(ProductRequest request, String userEmail) {
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

        // 4. Map DTO to Entity and Link the Vendor
        Product product = Product.builder()
                .vendor(vendor)
                .name(request.name())
                .description(request.description())
                .price(request.price())
                .stockQuantity(request.stockQuantity())
                .category(request.category())
                .imageUrl(request.imageUrl())
                .build();

        // 5. Save to Database
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