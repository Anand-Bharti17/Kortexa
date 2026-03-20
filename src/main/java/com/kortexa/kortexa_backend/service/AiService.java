package com.kortexa.kortexa_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class AiService {

    private final ChatClient chatClient;

    public AiService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    public String generateProductDescription(String productName, String category) {
        return chatClient.prompt()
                .user(String.format(
                        "You are an expert e-commerce copywriter. Write a professional, " +
                                "engaging, and persuasive product description for a product named '%s' " +
                                "in the '%s' category. Keep it under 100 words and focus on benefits.",
                        productName, category))
                .call()
                .content();
    }
}