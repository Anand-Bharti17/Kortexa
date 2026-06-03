package com.kortexa.kortexa_backend.controller;

import com.kortexa.kortexa_backend.model.Product;
import com.kortexa.kortexa_backend.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<List<Product>> getWishlist(Authentication authentication) {
        return ResponseEntity.ok(wishlistService.getWishlistProducts(authentication.getName()));
    }

    @GetMapping("/ids")
    public ResponseEntity<List<Long>> getWishlistIds(Authentication authentication) {
        return ResponseEntity.ok(wishlistService.getWishlistProductIds(authentication.getName()));
    }

    @PostMapping("/{productId}")
    public ResponseEntity<Map<String, String>> add(
            @PathVariable Long productId,
            Authentication authentication) {
        wishlistService.addToWishlist(authentication.getName(), productId);
        return ResponseEntity.ok(Map.of("message", "Added to wishlist"));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Map<String, String>> remove(
            @PathVariable Long productId,
            Authentication authentication) {
        wishlistService.removeFromWishlist(authentication.getName(), productId);
        return ResponseEntity.ok(Map.of("message", "Removed from wishlist"));
    }
}
