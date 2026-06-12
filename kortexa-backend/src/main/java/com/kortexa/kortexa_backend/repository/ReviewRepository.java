package com.kortexa.kortexa_backend.repository;

import com.kortexa.kortexa_backend.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByProductIdOrderByCreatedAtDesc(Long productId);

    List<Review> findByProductIdAndFlaggedFalseOrderByCreatedAtDesc(Long productId);

    // Find if a customer already reviewed a product
    java.util.Optional<Review> findByProductIdAndCustomerId(Long productId, Long customerId);

    // Let the database calculate the average rating!
    // COALESCE ensures it returns 0.0 instead of null if there are no reviews yet.
    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM Review r WHERE r.product.id = :productId AND r.flagged = false")
    Double getAverageRatingForProduct(@Param("productId") Long productId);

    @Query("""
            SELECT COALESCE(AVG(r.rating), 0.0), COUNT(r)
            FROM Review r
            JOIN r.product p
            WHERE p.vendor.id = :vendorId AND r.flagged = false
            """)
    Object[] getVendorRatingStats(@Param("vendorId") Long vendorId);
}