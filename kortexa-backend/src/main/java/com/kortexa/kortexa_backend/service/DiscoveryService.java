package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.model.Product;
import com.kortexa.kortexa_backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class DiscoveryService {

    private static final String TRENDING_KEY = "trending:products";
    private static final String RECENTLY_VIEWED_PREFIX = "recently_viewed:";

    private final StringRedisTemplate redisTemplate;
    private final ProductRepository productRepository;

    public void recordProductView(Long productId) {
        if (productId == null) return;
        try {
            redisTemplate.opsForZSet().incrementScore(TRENDING_KEY, productId.toString(), 1.0);
        } catch (Exception e) {
            log.warn("Failed to record trending view for productId={}", productId, e);
        }
    }

    public List<Product> getTrendingProducts(int limit) {
        try {
            Set<String> ids = redisTemplate.opsForZSet().reverseRange(TRENDING_KEY, 0, limit - 1);
            if (ids == null || ids.isEmpty()) {
                return productRepository
                        .searchAndFilterProducts(null, null, null, null, null, PageRequest.of(0, limit))
                        .getContent();
            }
            return fetchProductsInOrder(ids);
        } catch (Exception e) {
            log.error("Failed to load trending products", e);
            return Collections.emptyList();
        }
    }

    public List<Product> getRecommendedForUser(String userEmail, int limit) {
        if (userEmail == null || userEmail.isBlank()) {
            return Collections.emptyList();
        }
        try {
            String key = RECENTLY_VIEWED_PREFIX + userEmail;
            Set<String> recentIds = redisTemplate.opsForZSet().reverseRange(key, 0, 2);
            List<Long> recommendedIds = new ArrayList<>();

            if (recentIds != null && !recentIds.isEmpty()) {
                String latestId = recentIds.iterator().next();
                getFrequentlyBoughtTogetherIds(Long.parseLong(latestId)).forEach(recommendedIds::add);
            }

            if (recommendedIds.size() < limit) {
                Set<String> trending = redisTemplate.opsForZSet().reverseRange(TRENDING_KEY, 0, limit - 1);
                if (trending != null) {
                    for (String id : trending) {
                        long parsed = Long.parseLong(id);
                        if (!recommendedIds.contains(parsed)) {
                            recommendedIds.add(parsed);
                        }
                    }
                }
            }

            if (recommendedIds.isEmpty()) {
                return getTrendingProducts(limit);
            }

            List<Product> products = productRepository.findAllById(recommendedIds.stream().limit(limit).toList());
            return recommendedIds.stream()
                    .map(id -> products.stream().filter(p -> p.getId().equals(id)).findFirst().orElse(null))
                    .filter(p -> p != null)
                    .limit(limit)
                    .toList();
        } catch (Exception e) {
            log.error("Failed to load recommendations for user={}", userEmail, e);
            return getTrendingProducts(limit);
        }
    }

    private List<Long> getFrequentlyBoughtTogetherIds(Long productId) {
        try {
            Set<String> productIds = redisTemplate.opsForZSet().reverseRange("fbt:" + productId, 0, 3);
            if (productIds == null || productIds.isEmpty()) {
                return List.of();
            }
            return productIds.stream().map(Long::parseLong).toList();
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<Product> fetchProductsInOrder(Set<String> ids) {
        List<Long> ordered = ids.stream().map(Long::parseLong).toList();
        List<Product> products = productRepository.findAllById(ordered);
        return ordered.stream()
                .map(id -> products.stream().filter(p -> p.getId().equals(id)).findFirst().orElse(null))
                .filter(p -> p != null)
                .toList();
    }
}
