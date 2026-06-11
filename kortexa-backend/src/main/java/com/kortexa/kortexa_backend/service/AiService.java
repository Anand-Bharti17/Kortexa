package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.dto.AiSearchResponse;
import com.kortexa.kortexa_backend.dto.ReviewModerationResult;
import com.kortexa.kortexa_backend.model.Product;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
public class AiService {

    private final ChatClient chatClient;

    public AiService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    public String generateProductDescription(String productName, String category) {
        log.info("AI description generation requested: productName='{}', category='{}'", productName, category);
        String result = chatClient.prompt()
                .user(String.format(
                        "You are an expert e-commerce copywriter. Write a professional, " +
                                "engaging, and persuasive product description for a product named '%s' " +
                                "in the '%s' category. Keep it under 100 words and focus on benefits.",
                        productName, category))
                .call()
                .content();
        log.debug("AI description generated for productName='{}': {} chars", productName, result != null ? result.length() : 0);
        return result;
    }

    public String generateReviewSummary(java.util.List<String> reviews) {
        if (reviews == null || reviews.isEmpty()) {
            return "Not enough reviews to generate a summary yet.";
        }
        
        String combinedReviews = String.join("\n- ", reviews);
        log.info("AI review summary generation requested for {} reviews", reviews.size());
        
        String prompt = "You are an e-commerce assistant. Based on the following customer reviews for a product, " +
                "provide a concise 2-sentence summary of the overall customer sentiment. " +
                "Highlight the main pros and cons mentioned.\n\nReviews:\n- " + combinedReviews;
                
        String result = chatClient.prompt()
                .user(prompt)
                .call()
                .content();
        return result;
    }

    public AiSearchResponse interpretSearchQuery(String userQuery) {
        try {
            String prompt = """
                    You help shoppers search an e-commerce catalog.
                    Given the user message, reply with EXACTLY three lines:
                    SEARCH: individual words separated by spaces (NOT a sentence). Include product-type words and synonyms.
                    Example: "kids driving toys" -> kids toy toys car vehicle driving
                    Example: "wireless headphones" -> wireless headphones audio earphone
                    CATEGORY: one category from [Electronics, Clothing & Apparel, Home & Garden, Sports & Outdoors, Books & Media, Beauty & Personal Care, Toys & Games, Food & Beverages, Health & Wellness, Other] or NONE
                    MESSAGE: one short friendly sentence about what you understood
                    
                    User message: %s
                    """.formatted(userQuery.trim());

            String raw = chatClient.prompt().user(prompt).call().content();
            return parseSearchResponse(raw, userQuery);
        } catch (Exception e) {
            log.warn("AI search interpretation failed, using fallback: {}", e.getMessage());
            return new AiSearchResponse(userQuery.trim(), inferCategoryFromQuery(userQuery),
                    "Showing results for your search.");
        }
    }

    public ReviewModerationResult moderateReview(String comment, int rating) {
        if (comment == null || comment.isBlank()) {
            return new ReviewModerationResult(false, null);
        }
        try {
            String prompt = """
                    You moderate product reviews for an e-commerce store.
                    Reply with EXACTLY two lines:
                    DECISION: SAFE or FLAG
                    REASON: brief reason (max 80 chars) or NONE
                    FLAG for hate speech, spam, profanity, threats, harassment, or obvious fake/off-topic content.
                    
                    Rating: %d
                    Review: %s
                    """.formatted(rating, comment.trim());

            String raw = chatClient.prompt().user(prompt).call().content();
            boolean flagged = raw != null && raw.toUpperCase().contains("DECISION: FLAG");
            String note = null;
            if (raw != null) {
                for (String line : raw.split("\n")) {
                    if (line.trim().toUpperCase().startsWith("REASON:")) {
                        String reason = line.substring(7).trim();
                        if (!reason.equalsIgnoreCase("NONE") && !reason.isBlank()) {
                            note = reason.length() > 500 ? reason.substring(0, 500) : reason;
                        }
                    }
                }
            }
            return new ReviewModerationResult(flagged, note);
        } catch (Exception e) {
            log.warn("Review moderation failed, allowing review: {}", e.getMessage());
            return new ReviewModerationResult(false, null);
        }
    }

    public List<Long> suggestCartProductIds(BigDecimal budget, String occasion, List<Product> candidates) {
        if (candidates == null || candidates.isEmpty()) {
            return List.of();
        }
        StringBuilder catalog = new StringBuilder();
        for (Product p : candidates) {
            catalog.append("ID=").append(p.getId())
                    .append(" | ").append(p.getName())
                    .append(" | ₹").append(p.getPrice())
                    .append(" | ").append(p.getCategory() != null ? p.getCategory() : "General")
                    .append("\n");
        }

        String prompt = """
                You help shoppers build a gift bundle on an Indian e-commerce site (prices in INR).
                Pick 2-4 product IDs from the catalog whose TOTAL price stays at or under the budget.
                Prefer variety and relevance to the occasion.
                Reply with EXACTLY two lines:
                IDS: comma-separated numeric product IDs only (e.g. 3,7,12)
                MESSAGE: one friendly sentence explaining the bundle
                
                Budget: ₹%s
                Occasion: %s
                Catalog:
                %s
                """.formatted(
                budget.stripTrailingZeros().toPlainString(),
                occasion != null && !occasion.isBlank() ? occasion.trim() : "general shopping",
                catalog);

        try {
            String raw = chatClient.prompt().user(prompt).call().content();
            Set<Long> validIds = new LinkedHashSet<>();
            candidates.forEach(p -> validIds.add(p.getId()));
            List<Long> picked = new ArrayList<>();
            if (raw != null) {
                for (String line : raw.split("\n")) {
                    if (line.trim().toUpperCase().startsWith("IDS:")) {
                        String idsPart = line.substring(4).trim();
                        for (String token : idsPart.split("[,\\s]+")) {
                            if (token.isBlank()) continue;
                            try {
                                long id = Long.parseLong(token.trim());
                                if (validIds.contains(id) && !picked.contains(id)) {
                                    picked.add(id);
                                }
                            } catch (NumberFormatException ignored) {
                                // skip invalid token
                            }
                        }
                    }
                }
            }
            if (picked.isEmpty()) {
                BigDecimal running = BigDecimal.ZERO;
                for (Product p : candidates) {
                    if (running.add(p.getPrice()).compareTo(budget) <= 0) {
                        picked.add(p.getId());
                        running = running.add(p.getPrice());
                        if (picked.size() >= 3) break;
                    }
                }
            }
            return picked;
        } catch (Exception e) {
            log.warn("AI cart suggest failed, using price fallback: {}", e.getMessage());
            List<Long> fallback = new ArrayList<>();
            BigDecimal running = BigDecimal.ZERO;
            for (Product p : candidates) {
                if (running.add(p.getPrice()).compareTo(budget) <= 0) {
                    fallback.add(p.getId());
                    running = running.add(p.getPrice());
                    if (fallback.size() >= 3) break;
                }
            }
            return fallback;
        }
    }

    public String extractCartSuggestMessage(BigDecimal budget, String occasion, List<Product> picked) {
        if (picked.isEmpty()) {
            return "No in-stock products found under ₹" + budget.stripTrailingZeros().toPlainString() + ".";
        }
        BigDecimal total = picked.stream()
                .map(Product::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        String occasionText = occasion != null && !occasion.isBlank() ? occasion.trim() : "your budget";
        return "Here is a suggested bundle for " + occasionText
                + " (₹" + total.stripTrailingZeros().toPlainString() + " total).";
    }

    public String answerProductQuestion(String productName, String description, String category,
                                        java.util.List<String> reviewSnippets, String question) {
        String reviewsBlock = reviewSnippets.isEmpty()
                ? "No reviews yet."
                : String.join("\n- ", reviewSnippets);

        String prompt = """
                You are a helpful Veluno shopping assistant. Answer in 2-4 concise sentences.
                Do not invent specs not implied by the data. If unsure, say so.
                
                Product: %s
                Category: %s
                Description: %s
                Review snippets:
                - %s
                
                Shopper question: %s
                """.formatted(
                productName,
                category != null ? category : "General",
                description != null ? description : "No description",
                reviewsBlock,
                question);

        try {
            return chatClient.prompt().user(prompt).call().content();
        } catch (Exception e) {
            log.error("AI product chat failed", e);
            return "I could not generate an answer right now. Please try again in a moment.";
        }
    }

    private AiSearchResponse parseSearchResponse(String raw, String fallbackQuery) {
        String search = fallbackQuery;
        String category = null;
        String message = "Here are products matching your request.";

        if (raw != null) {
            for (String line : raw.split("\n")) {
                String trimmed = line.trim();
                if (trimmed.toUpperCase().startsWith("SEARCH:")) {
                    search = trimmed.substring(7).trim();
                } else if (trimmed.toUpperCase().startsWith("CATEGORY:")) {
                    String cat = trimmed.substring(9).trim();
                    if (!cat.equalsIgnoreCase("NONE") && !cat.isBlank()) {
                        category = cat;
                    }
                } else if (trimmed.toUpperCase().startsWith("MESSAGE:")) {
                    message = trimmed.substring(8).trim();
                }
            }
        }
        return new AiSearchResponse(search, category != null ? category : inferCategoryFromQuery(fallbackQuery), message);
    }

    private String inferCategoryFromQuery(String query) {
        if (query == null) return null;
        String q = query.toLowerCase();
        if (q.contains("toy") || q.contains("kids") || q.contains("children")) {
            return "Toys & Games";
        }
        if (q.contains("beauty") || q.contains("makeup") || q.contains("skincare")) {
            return "Beauty & Personal Care";
        }
        if (q.contains("game") || q.contains("gaming") || q.contains("pc") || q.contains("laptop")) {
            return "Electronics";
        }
        return null;
    }
}