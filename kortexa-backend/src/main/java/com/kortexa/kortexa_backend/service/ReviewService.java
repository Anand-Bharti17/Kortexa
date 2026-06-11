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
    private final AiService aiService;
    private final ActivityService activityService;

    @org.springframework.cache.annotation.CacheEvict(value = "review_summaries", key = "#productId")
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

        // 3. Check for existing review
        java.util.Optional<Review> existingReview = reviewRepository.findByProductIdAndCustomerId(product.getId(), customer.getId());

        Review review;
        if (existingReview.isPresent()) {
            review = existingReview.get();
            review.setRating(request.getRating());
            review.setComment(request.getComment());
            log.info("Updating existing review: reviewId={}", review.getId());
        } else {
            review = Review.builder()
                    .rating(request.getRating())
                    .comment(request.getComment())
                    .product(product)
                    .customer(customer)
                    .build();
            log.info("Creating new review");
        }

        var moderation = aiService.moderateReview(request.getComment(), request.getRating());
        review.setFlagged(moderation.flagged());
        review.setModerationNote(moderation.note());

        Review saved = reviewRepository.save(review);
        log.info("Review saved: reviewId={}, productId={}, customer={}, flagged={}",
                saved.getId(), productId, customerEmail, saved.getFlagged());

        if (Boolean.TRUE.equals(saved.getFlagged())) {
            throw new IllegalArgumentException(
                    "Your review could not be published. Please revise your comment and try again.");
        }

        activityService.log(
                com.kortexa.kortexa_backend.model.ActivityType.REVIEW_POSTED,
                customerEmail, customer.getRole().name(),
                "Reviewed " + product.getName() + " (" + request.getRating() + " stars)",
                "PRODUCT", productId);

        return saved;
    }

    public List<Review> getProductReviews(Long productId) {
        log.debug("Fetching reviews for productId={}", productId);
        return reviewRepository.findByProductIdAndFlaggedFalseOrderByCreatedAtDesc(productId);
    }

    public Double getProductAverageRating(Long productId) {
        log.debug("Fetching average rating for productId={}", productId);
        return reviewRepository.getAverageRatingForProduct(productId);
    }

    @org.springframework.cache.annotation.Cacheable(value = "review_summaries", key = "#productId")
    public String getReviewSummary(Long productId) {
        log.info("Fetching review summary for productId={}", productId);
        List<Review> reviews = getProductReviews(productId);
        if (reviews.size() < 2) {
            return "Need more reviews to generate an AI summary.";
        }
        
        List<String> reviewComments = reviews.stream()
                .map(Review::getComment)
                .filter(c -> c != null && !c.isBlank())
                .limit(20) // Limit to 20 recent reviews for the prompt
                .toList();
                
        return aiService.generateReviewSummary(reviewComments);
    }
}