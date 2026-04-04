package com.kortexa.kortexa_backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final StringRedisTemplate redisTemplate;
    private static final String FBT_KEY_PREFIX = "fbt:"; // Frequently Bought Together

    @KafkaListener(topics = "order-analytics", groupId = "kortexa-analytics-group")
    public void processFrequentlyBoughtTogether(String payload) {
        log.info("[KAFKA CONSUMER] Processing analytics payload: {}", payload);
        
        try {
            // Payload is comma separated product IDs e.g. "1,4,5"
            List<String> productIds = Arrays.asList(payload.split(","));
            
            if (productIds.size() < 2) return;

            // Increment ZSET scores for each pair
            for (int i = 0; i < productIds.size(); i++) {
                String currentId = productIds.get(i);
                String redisKey = FBT_KEY_PREFIX + currentId;
                
                for (int j = 0; j < productIds.size(); j++) {
                    if (i == j) continue; // Don't associate a product with itself
                    
                    String companionId = productIds.get(j);
                    // Increment the association score by 1
                    redisTemplate.opsForZSet().incrementScore(redisKey, companionId, 1.0);
                }
            }
            log.info("[KAFKA CONSUMER] Successfully updated Redis associations for products: {}", payload);
        } catch (Exception e) {
            log.error("[KAFKA CONSUMER] Error processing analytics payload: {}", payload, e);
        }
    }
}
