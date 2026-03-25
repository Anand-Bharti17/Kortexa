package com.kortexa.kortexa_backend.controller;

import com.kortexa.kortexa_backend.dto.CartItemRequest;
import com.kortexa.kortexa_backend.model.Cart;
import com.kortexa.kortexa_backend.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@Slf4j
@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

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
}