package com.kortexa.kortexa_backend.controller;

import com.kortexa.kortexa_backend.dto.AiCartSuggestRequest;
import com.kortexa.kortexa_backend.dto.AiCartSuggestResponse;
import com.kortexa.kortexa_backend.dto.AiChatRequest;
import com.kortexa.kortexa_backend.dto.AiSearchRequest;
import com.kortexa.kortexa_backend.dto.AiSearchResponse;
import com.kortexa.kortexa_backend.model.Product;
import com.kortexa.kortexa_backend.model.Review;
import com.kortexa.kortexa_backend.repository.ReviewRepository;
import com.kortexa.kortexa_backend.service.AiCartAssistantService;
import com.kortexa.kortexa_backend.service.AiService;
import com.kortexa.kortexa_backend.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;
    private final AiCartAssistantService aiCartAssistantService;
    private final ProductService productService;
    private final ReviewRepository reviewRepository;

    @PostMapping("/search")
    public ResponseEntity<AiSearchResponse> aiSearch(@Valid @RequestBody AiSearchRequest request) {
        return ResponseEntity.ok(aiService.interpretSearchQuery(request.query()));
    }

    @PostMapping("/cart-suggest")
    public ResponseEntity<AiCartSuggestResponse> cartSuggest(
            @Valid @RequestBody AiCartSuggestRequest request,
            Principal principal) {
        return ResponseEntity.ok(aiCartAssistantService.suggest(request));
    }

    @PostMapping("/product/{productId}/chat")
    public ResponseEntity<Map<String, String>> productChat(
            @PathVariable Long productId,
            @Valid @RequestBody AiChatRequest request) {
        Product product = productService.getProductById(productId, null);
        List<Review> reviews = reviewRepository.findByProductIdAndFlaggedFalseOrderByCreatedAtDesc(productId);
        List<String> snippets = reviews.stream()
                .limit(5)
                .map(Review::getComment)
                .toList();

        String answer = aiService.answerProductQuestion(
                product.getName(),
                product.getDescription(),
                product.getCategory(),
                snippets,
                request.question());

        return ResponseEntity.ok(Map.of("answer", answer));
    }
}
