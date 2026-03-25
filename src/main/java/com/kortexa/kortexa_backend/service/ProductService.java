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

    public List<Product> getAllProducts() {
        log.debug("Fetching all products from catalog");
        return productRepository.findAll();
    }

    public List<Product> getMyProducts(String userEmail) {
        log.debug("Fetching products for vendor: {}", userEmail);
        User vendor = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return productRepository.findByVendorId(vendor.getId());
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