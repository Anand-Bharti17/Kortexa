package com.kortexa.kortexa_backend.repository;

import com.kortexa.kortexa_backend.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // Explicitly fetch all products with vendor to avoid lazy loading issues
    @Query("SELECT DISTINCT p FROM Product p JOIN FETCH p.vendor ORDER BY p.id DESC")
    List<Product> findAll();

    // Spring Data JPA automatically writes the SQL for these based on the method names!
    List<Product> findByVendorId(Long vendorId);

    List<Product> findByCategory(String category);
    
    // This query cleverly ignores parameters that are null and eagerly fetches vendor!
    @Query("SELECT DISTINCT p FROM Product p JOIN FETCH p.vendor WHERE " +
            "(:search IS NULL OR LOWER(p.name) LIKE :search OR LOWER(p.description) LIKE :search) AND " +
            "(:category IS NULL OR p.category = :category) AND " +
            "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
            "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
            "(:featuredOnly IS NULL OR p.featured = :featuredOnly)")
    Page<Product> searchAndFilterProducts(
            @Param("search") String search,
            @Param("category") String category,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("featuredOnly") Boolean featuredOnly,
            Pageable pageable);

    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.category IS NOT NULL AND p.category <> '' ORDER BY p.category")
    List<String> findDistinctCategories();

    @Query(value = """
            SELECT p.id FROM products p
            WHERE to_tsvector('english',
                    coalesce(p.name, '') || ' ' || coalesce(p.description, '') || ' ' || coalesce(p.category, ''))
                  @@ plainto_tsquery('english', :searchText)
            ORDER BY ts_rank(
                to_tsvector('english',
                    coalesce(p.name, '') || ' ' || coalesce(p.description, '') || ' ' || coalesce(p.category, '')),
                plainto_tsquery('english', :searchText)
            ) DESC
            """,
            countQuery = """
            SELECT count(*) FROM products p
            WHERE to_tsvector('english',
                    coalesce(p.name, '') || ' ' || coalesce(p.description, '') || ' ' || coalesce(p.category, ''))
                  @@ plainto_tsquery('english', :searchText)
            """,
            nativeQuery = true)
    Page<Long> fullTextSearchIds(@Param("searchText") String searchText, Pageable pageable);

    @Query("SELECT p FROM Product p JOIN FETCH p.vendor WHERE p.id IN :ids")
    List<Product> findAllWithVendorByIdIn(@Param("ids") List<Long> ids);

    List<Product> findByCategoryAndPriceLessThanEqualAndStockQuantityGreaterThan(
            String category, BigDecimal maxPrice, int minStock, Pageable pageable);
}