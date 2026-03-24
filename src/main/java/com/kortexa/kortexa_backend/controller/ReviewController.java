package com.kortexa.kortexa_backend.controller;

import com.kortexa.kortexa_backend.dto.ReviewRequest;
import com.kortexa.kortexa_backend.model.Review;
import com.kortexa.kortexa_backend.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // 1. Add a review (Requires the user to be logged in as a Customer)
    @PostMapping("/product/{productId}")
    public ResponseEntity<Review> addReview(
            @PathVariable Long productId,
            @Valid @RequestBody ReviewRequest request,
            Principal principal) { // Principal securely holds the email from the JWT

        Review savedReview = reviewService.addReview(productId, principal.getName(), request);
        return ResponseEntity.ok(savedReview);
    }

    // 2. Get all reviews for a product (Public - anyone can read reviews)
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Review>> getProductReviews(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getProductReviews(productId));
    }

    // 3. Get the average rating (Public)
    @GetMapping("/product/{productId}/average")
    public ResponseEntity<Map<String, Double>> getAverageRating(@PathVariable Long productId) {
        Double average = reviewService.getProductAverageRating(productId);
        return ResponseEntity.ok(Map.of("averageRating", average));
    }
}