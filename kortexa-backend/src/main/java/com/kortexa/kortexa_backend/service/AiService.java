package com.kortexa.kortexa_backend.service;

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
}