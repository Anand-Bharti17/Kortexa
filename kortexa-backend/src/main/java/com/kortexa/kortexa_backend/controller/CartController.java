package com.kortexa.kortexa_backend.controller;

import com.kortexa.kortexa_backend.dto.ApplyCouponRequest;
import com.kortexa.kortexa_backend.dto.CartItemRequest;
import com.kortexa.kortexa_backend.dto.CartSummaryResponse;
import com.kortexa.kortexa_backend.model.Cart;
import com.kortexa.kortexa_backend.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping("/summary")
    public ResponseEntity<CartSummaryResponse> getCartSummary(Principal principal) {
        return ResponseEntity.ok(cartService.getCartSummary(principal.getName()));
    }

    // 1. View the Cart
    @GetMapping
    public ResponseEntity<Cart> getCart(Principal principal) {
        log.debug("Get cart request: user={}", principal.getName());
        // Principal automatically holds the logged-in user's email from their JWT!
        Cart cart = cartService.getOrCreateCart(principal.getName());
        return ResponseEntity.ok(cart);
    }

    // 2. Add an Item to the Cart
    @PostMapping("/add")
    public ResponseEntity<Cart> addItemToCart(
            @Valid @RequestBody CartItemRequest request,
            Principal principal) {
        log.debug("Add to cart request: user={}, productId={}", principal.getName(), request.getProductId());
        Cart updatedCart = cartService.addItemToCart(principal.getName(), request);
        return ResponseEntity.ok(updatedCart);
    }

    // 3. Remove an Item completely from the Cart
    @DeleteMapping("/remove/{productId}")
    public ResponseEntity<Cart> removeItemFromCart(
            @PathVariable Long productId,
            Principal principal) {
        log.debug("Remove from cart request: user={}, productId={}", principal.getName(), productId);
        Cart updatedCart = cartService.removeItemFromCart(principal.getName(), productId);
        return ResponseEntity.ok(updatedCart);
    }

    @PostMapping("/coupon")
    public ResponseEntity<?> applyCoupon(
            @Valid @RequestBody ApplyCouponRequest request,
            Principal principal) {
        try {
            return ResponseEntity.ok(cartService.applyCoupon(principal.getName(), request.getCode()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/coupon")
    public ResponseEntity<CartSummaryResponse> removeCoupon(Principal principal) {
        return ResponseEntity.ok(cartService.removeCoupon(principal.getName()));
    }

    @PutMapping("/shipping-address/{addressId}")
    public ResponseEntity<CartSummaryResponse> selectShippingAddress(
            @PathVariable Long addressId,
            Principal principal) {
        try {
            return ResponseEntity.ok(cartService.selectShippingAddress(principal.getName(), addressId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}