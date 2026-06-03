package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.dto.AiSearchResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

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