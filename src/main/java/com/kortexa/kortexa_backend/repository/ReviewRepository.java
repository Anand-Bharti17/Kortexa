package com.kortexa.kortexa_backend.repository;

import com.kortexa.kortexa_backend.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    // Fetch all reviews for a specific product, newest first
    List<Review> findByProductIdOrderByCreatedAtDesc(Long productId);

    // Let the database calculate the average rating!
    // COALESCE ensures it returns 0.0 instead of null if there are no reviews yet.
    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM Review r WHERE r.product.id = :productId")
    Double getAverageRatingForProduct(@Param("productId") Long productId);
}