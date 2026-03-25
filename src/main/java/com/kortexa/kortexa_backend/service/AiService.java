package com.kortexa.kortexa_backend.service;

import lombok.RequiredArgsConstructor;
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
}