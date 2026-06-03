package com.kortexa.kortexa_backend.controller;

import com.kortexa.kortexa_backend.model.Product;
import com.kortexa.kortexa_backend.service.DiscoveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/discovery")
@RequiredArgsConstructor
public class DiscoveryController {

    private final DiscoveryService discoveryService;

    @GetMapping("/trending")
    public ResponseEntity<List<Product>> getTrending(
            @RequestParam(defaultValue = "8") int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 24);
        return ResponseEntity.ok(discoveryService.getTrendingProducts(safeLimit));
    }

    @GetMapping("/recommended")
    public ResponseEntity<List<Product>> getRecommended(
            Authentication authentication,
            @RequestParam(defaultValue = "8") int limit) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        int safeLimit = Math.min(Math.max(limit, 1), 24);
        return ResponseEntity.ok(discoveryService.getRecommendedForUser(authentication.getName(), safeLimit));
    }
}
