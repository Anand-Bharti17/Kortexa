package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.dto.ProductRequest;
import com.kortexa.kortexa_backend.dto.ProductSuggestion;
import com.kortexa.kortexa_backend.model.AccountStatus;
import com.kortexa.kortexa_backend.model.Product;
import com.kortexa.kortexa_backend.model.Role;
import com.kortexa.kortexa_backend.model.User;
import com.kortexa.kortexa_backend.repository.ProductRepository;
import com.kortexa.kortexa_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.domain.PageImpl;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final EntityManager entityManager;
    private final UserRepository userRepository;
    private final ImageUploadService cloudinaryService;
    private final AiService geminiService;
    private final DiscoveryService discoveryService;
    private final org.springframework.data.redis.core.StringRedisTemplate redisTemplate;

    private static final String RECENTLY_VIEWED_KEY_PREFIX = "recently_viewed:";

    @CacheEvict(value = "products", allEntries = true)
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
                 uploadedImageUrl = cloudinaryService.uploadImage(file);
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
                 finalDescription = geminiService.generateProductDescription(request.name(),request.category());

                // Temporary fallback until Gemini is wired up:
//                finalDescription = "A premium " + request.name() + " offered by " + vendor.getEmail();
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
                .featured(Boolean.TRUE.equals(request.featured()))
                .build();

        // 7. Save to Database
        Product saved = productRepository.save(product);
        log.info("Product created successfully: productId={}, name='{}', vendor={}", saved.getId(), saved.getName(), userEmail);
        return saved;
    }

    @Cacheable(value = "products")
    public List<Product> getAllProducts() {
        log.info("Fetching full product catalog from database");
        List<Product> products = productRepository.findAll();
        log.info("Retrieved {} products from database", products.size());
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

    public Page<Product> browsePublicStore(String search, String category, BigDecimal minPrice, BigDecimal maxPrice,
            int page, int size, String sortBy, String sortDir) {
        log.debug("Public store browse: search='{}', category='{}', minPrice={}, maxPrice={}, page={}, size={}, sortBy={}, sortDir={}",
                search, category, minPrice, maxPrice, page, size, sortBy, sortDir);

        String safeSortField = switch (sortBy == null ? "" : sortBy) {
            case "price", "name", "createdAt" -> sortBy;
            default -> "id";
        };
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, safeSortField));

        List<String> tokens = tokenizeSearchTerms(search);
        if (!tokens.isEmpty()) {
            return searchByAnyToken(tokens, category, minPrice, maxPrice, null, pageable);
        }

        return productRepository.searchAndFilterProducts(
                null, category, minPrice, maxPrice, null, pageable);
    }

    public List<ProductSuggestion> suggestProducts(String query, int limit) {
        List<String> tokens = tokenizeSearchTerms(query);
        if (tokens.isEmpty()) {
            return List.of();
        }
        int safeLimit = Math.min(Math.max(limit, 1), 12);
        Page<Product> page = searchByAnyToken(
                tokens, null, null, null, null, PageRequest.of(0, safeLimit, Sort.by("name")));
        return page.getContent().stream()
                .map(p -> new ProductSuggestion(
                        p.getId(), p.getName(), p.getCategory(), p.getPrice(), p.getImageUrl()))
                .toList();
    }

    private List<String> tokenizeSearchTerms(String search) {
        if (search == null || search.isBlank()) {
            return List.of();
        }
        Set<String> tokens = new LinkedHashSet<>();
        for (String part : search.toLowerCase().split("[,;]+")) {
            for (String word : part.split("\\s+")) {
                String trimmed = word.trim();
                if (trimmed.length() >= 2) {
                    tokens.add(trimmed);
                }
            }
        }
        return expandSearchTokens(new ArrayList<>(tokens));
    }

    private List<String> expandSearchTokens(List<String> tokens) {
        Set<String> expanded = new LinkedHashSet<>(tokens);
        for (String token : tokens) {
            if (token.equals("toy") || token.equals("toys")) {
                expanded.add("toy");
                expanded.add("toys");
            }
            if (token.equals("kid") || token.equals("kids") || token.equals("children")) {
                expanded.add("toy");
                expanded.add("toys");
            }
            if (token.equals("car") || token.equals("cars") || token.equals("vehicle")) {
                expanded.add("car");
            }
            if (token.equals("drive") || token.equals("driving")) {
                expanded.add("car");
                expanded.add("toy");
            }
        }
        return new ArrayList<>(expanded);
    }

    private Page<Product> searchByAnyToken(
            List<String> tokens,
            String category,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean featuredOnly,
            Pageable pageable) {

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();

        CriteriaQuery<Product> query = cb.createQuery(Product.class);
        Root<Product> root = query.from(Product.class);
        root.fetch("vendor");
        query.distinct(true);

        List<Predicate> andPredicates = new ArrayList<>();

        List<Predicate> tokenOrs = new ArrayList<>();
        for (String token : tokens) {
            String pattern = "%" + token + "%";
            tokenOrs.add(cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern),
                    cb.like(cb.lower(root.get("category")), pattern)));
        }
        andPredicates.add(cb.or(tokenOrs.toArray(Predicate[]::new)));

        if (category != null && !category.isBlank()) {
            andPredicates.add(cb.equal(root.get("category"), category));
        }
        if (minPrice != null) {
            andPredicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
        }
        if (maxPrice != null) {
            andPredicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
        }
        if (featuredOnly != null) {
            andPredicates.add(cb.equal(root.get("featured"), featuredOnly));
        }

        query.where(andPredicates.toArray(Predicate[]::new));

        pageable.getSort().forEach(order -> {
            var path = root.get(order.getProperty());
            query.orderBy(order.isAscending() ? cb.asc(path) : cb.desc(path));
        });

        TypedQuery<Product> typedQuery = entityManager.createQuery(query);
        typedQuery.setFirstResult((int) pageable.getOffset());
        typedQuery.setMaxResults(pageable.getPageSize());
        List<Product> content = typedQuery.getResultList();

        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Product> countRoot = countQuery.from(Product.class);
        countQuery.select(cb.countDistinct(countRoot));

        List<Predicate> countAnds = new ArrayList<>();
        List<Predicate> countTokenOrs = new ArrayList<>();
        for (String token : tokens) {
            String pattern = "%" + token + "%";
            countTokenOrs.add(cb.or(
                    cb.like(cb.lower(countRoot.get("name")), pattern),
                    cb.like(cb.lower(countRoot.get("description")), pattern),
                    cb.like(cb.lower(countRoot.get("category")), pattern)));
        }
        countAnds.add(cb.or(countTokenOrs.toArray(Predicate[]::new)));
        if (category != null && !category.isBlank()) {
            countAnds.add(cb.equal(countRoot.get("category"), category));
        }
        if (minPrice != null) {
            countAnds.add(cb.greaterThanOrEqualTo(countRoot.get("price"), minPrice));
        }
        if (maxPrice != null) {
            countAnds.add(cb.lessThanOrEqualTo(countRoot.get("price"), maxPrice));
        }
        if (featuredOnly != null) {
            countAnds.add(cb.equal(countRoot.get("featured"), featuredOnly));
        }
        countQuery.where(countAnds.toArray(Predicate[]::new));

        long total = entityManager.createQuery(countQuery).getSingleResult();

        return new PageImpl<>(content, pageable, total);
    }

    public Page<Product> browseFeaturedProducts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return productRepository.searchAndFilterProducts(null, null, null, null, true, pageable);
    }

    public List<String> getStoreCategories() {
        return productRepository.findDistinctCategories();
    }

    public Product getProductById(Long id, String userEmail) {
        log.debug("Fetching product details: productId={}", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Product not found: productId={}", id);
                    return new IllegalArgumentException("Product not found");
                });
                
        discoveryService.recordProductView(id);

        if (userEmail != null && !userEmail.equals("anonymousUser")) {
            recordRecentlyViewed(id, userEmail);
        }

        log.debug("Product retrieved: id={}, name='{}', vendor={}", product.getId(), product.getName(), product.getVendor().getEmail());
        return product;
    }

    private void recordRecentlyViewed(Long productId, String userEmail) {
        try {
            String key = RECENTLY_VIEWED_KEY_PREFIX + userEmail;
            redisTemplate.opsForZSet().add(key, productId.toString(), System.currentTimeMillis());
            redisTemplate.opsForZSet().removeRange(key, 0, -11); // Keep last 10
            redisTemplate.expire(key, 7, java.util.concurrent.TimeUnit.DAYS);
        } catch (Exception e) {
            log.warn("Failed to record recently viewed product for user={}", userEmail, e);
        }
    }

    public List<Product> getRecentlyViewedProducts(String userEmail) {
        try {
            if (userEmail == null || userEmail.equals("anonymousUser")) return java.util.Collections.emptyList();
            String key = RECENTLY_VIEWED_KEY_PREFIX + userEmail;
            java.util.Set<String> productIds = redisTemplate.opsForZSet().reverseRange(key, 0, 9);
            if (productIds == null || productIds.isEmpty()) {
                return java.util.Collections.emptyList();
            }
            List<Long> idsToFetch = productIds.stream().map(Long::valueOf).toList();
            List<Product> products = productRepository.findAllById(idsToFetch);
            java.util.Map<Long, Product> productMap = products.stream().collect(java.util.stream.Collectors.toMap(Product::getId, p -> p));
            return idsToFetch.stream()
                    .map(productMap::get)
                    .filter(java.util.Objects::nonNull)
                    .toList();
        } catch (Exception e) {
            log.error("Failed to fetch recently viewed products for user={}", userEmail, e);
            return java.util.Collections.emptyList();
        }
    }

    public List<Product> getFrequentlyBoughtTogether(Long productId) {
        try {
            String key = "fbt:" + productId;
            // Get top 4 products with highest score
            java.util.Set<String> productIds = redisTemplate.opsForZSet().reverseRange(key, 0, 3);
            if (productIds == null || productIds.isEmpty()) {
                return java.util.Collections.emptyList();
            }
            List<Long> idsToFetch = productIds.stream().map(Long::valueOf).toList();
            List<Product> products = productRepository.findAllById(idsToFetch);
            
            // Re-order them to match the order in Redis
            java.util.Map<Long, Product> productMap = products.stream().collect(java.util.stream.Collectors.toMap(Product::getId, p -> p));
            return idsToFetch.stream()
                    .map(productMap::get)
                    .filter(java.util.Objects::nonNull)
                    .toList();
        } catch (Exception e) {
            log.error("Failed to fetch frequently bought together for productId={}", productId, e);
            return java.util.Collections.emptyList();
        }
    }

    @CacheEvict(value = "products", allEntries = true)
    public Product updateProduct(Long productId, ProductRequest request, MultipartFile file, String userEmail) {
        log.info("Product update request by vendor: email={}, productId={}", userEmail, productId);

        // 1. Find the product
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> {
                    log.warn("Product not found for update: productId={}", productId);
                    return new IllegalArgumentException("Product not found");
                });

        // 2. Find the user and verify they are the vendor
        User vendor = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> {
                    log.warn("User not found for product update: email={}", userEmail);
                    return new IllegalArgumentException("User not found");
                });

        // 3. Verify ownership: only the vendor who created the product can edit it
        if (!product.getVendor().getId().equals(vendor.getId())) {
            log.warn("Product update denied - user is not the vendor: productId={}, vendorId={}, attemptedBy={}", 
                    productId, product.getVendor().getId(), userEmail);
            throw new SecurityException("You can only edit your own products.");
        }

        // 4. Update product fields
        product.setName(request.name());
        product.setPrice(request.price());
        product.setStockQuantity(request.stockQuantity());
        product.setCategory(request.category());
        if (request.featured() != null) {
            product.setFeatured(request.featured());
        }

        // 5. Update image if provided
        if (file != null && !file.isEmpty()) {
            try {
                String uploadedImageUrl = cloudinaryService.uploadImage(file);
                product.setImageUrl(uploadedImageUrl);
                log.info("Product image updated for productId={}", productId);
            } catch (Exception e) {
                log.error("Failed to upload image during product update", e);
                throw new RuntimeException("Image upload failed: " + e.getMessage());
            }
        }

        // 6. Update description if provided (or regenerate if changed)
        if (request.description() != null && !request.description().isBlank()) {
            product.setDescription(request.description());
        }

        // 7. Save and return
        Product updated = productRepository.save(product);
        log.info("Product updated successfully: productId={}, vendor={}", updated.getId(), userEmail);
        return updated;
    }

    @CacheEvict(value = "products", allEntries = true)
    public Product updateProductStock(Long productId, Integer quantity, String userEmail) {
        log.info("Stock update request by vendor: email={}, productId={}, newQuantity={}", userEmail, productId, quantity);

        // Validate quantity
        if (quantity < 0) {
            log.warn("Invalid stock quantity provided: {}", quantity);
            throw new IllegalArgumentException("Stock quantity cannot be negative");
        }

        // 1. Find the product
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> {
                    log.warn("Product not found for stock update: productId={}", productId);
                    return new IllegalArgumentException("Product not found");
                });

        // 2. Find the user and verify they are the vendor
        User vendor = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> {
                    log.warn("User not found for stock update: email={}", userEmail);
                    return new IllegalArgumentException("User not found");
                });

        // 3. Verify ownership: only the vendor who created the product can edit it
        if (!product.getVendor().getId().equals(vendor.getId())) {
            log.warn("Stock update denied - user is not the vendor: productId={}, vendorId={}, attemptedBy={}", 
                    productId, product.getVendor().getId(), userEmail);
            throw new SecurityException("You can only edit your own products.");
        }

        // 4. Update stock
        product.setStockQuantity(quantity);
        Product updated = productRepository.save(product);
        log.info("Stock updated successfully: productId={}, newQuantity={}, vendor={}", updated.getId(), quantity, userEmail);
        return updated;
    }
}