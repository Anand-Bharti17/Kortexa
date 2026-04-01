package com.kortexa.kortexa_backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Initializes and clears caches on application startup
 * to prevent deserialization errors from stale cached objects
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CacheInitializer {

    private final CacheManager cacheManager;

    @EventListener(ContextRefreshedEvent.class)
    public void clearAllCachesOnStartup() {
        try {
            log.info("Starting cache initialization on application startup...");
            
            if (cacheManager != null) {
                // Clear all caches via CacheManager
                cacheManager.getCacheNames().forEach(cacheName -> {
                    try {
                        var cache = cacheManager.getCache(cacheName);
                        if (cache != null) {
                            cache.clear();
                            log.info("✓ Cleared cache: {}", cacheName);
                        }
                    } catch (Exception e) {
                        log.warn("Failed to clear cache '{}': {}", cacheName, e.getMessage());
                    }
                });

                // Explicitly clear the 'products' cache in Redis even if it has not been created yet
                try {
                    var productsCache = cacheManager.getCache("products");
                    if (productsCache != null) {
                        productsCache.clear();
                        log.info("✓ Explicitly cleared cache: products");
                    }
                } catch (Exception e) {
                    log.warn("Failed to explicitly clear products cache: {}", e.getMessage());
                }
                
                log.info("✓ All caches cleared successfully");
            }
        } catch (Exception e) {
            log.warn("Error during cache initialization (non-critical): {}", e.getMessage());
        }
    }
}

