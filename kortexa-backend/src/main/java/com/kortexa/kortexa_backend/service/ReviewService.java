package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.dto.ReviewRequest;
import com.kortexa.kortexa_backend.model.Product;
import com.kortexa.kortexa_backend.model.Review;
import com.kortexa.kortexa_backend.model.User;
import com.kortexa.kortexa_backend.repository.ProductRepository;
import com.kortexa.kortexa_backend.repository.ReviewRepository;
import com.kortexa.kortexa_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public Review addReview(Long productId, String customerEmail, ReviewRequest request) {
        log.info("Review submission: productId={}, customer={}, rating={}", productId, customerEmail, request.getRating());
        // 1. Find the product
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> {
                    log.warn("Review failed - product not found: productId={}", productId);
                    return new RuntimeException("Product not found");
                });

        // 2. Find the customer
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> {
                    log.warn("Review failed - customer not found: email={}", customerEmail);
                    return new RuntimeException("Customer not found");
                });

        // 3. Build and save the review
        Review review = Review.builder()
                .rating(request.getRating())
                .comment(request.getComment())
                .product(product)
                .customer(customer)
                .build();

        Review saved = reviewRepository.save(review);
        log.info("Review saved: reviewId={}, productId={}, customer={}", saved.getId(), productId, customerEmail);
        return saved;
    }

    public List<Review> getProductReviews(Long productId) {
        log.debug("Fetching reviews for productId={}", productId);
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    public Double getProductAverageRating(Long productId) {
        log.debug("Fetching average rating for productId={}", productId);
        return reviewRepository.getAverageRatingForProduct(productId);
    }
}