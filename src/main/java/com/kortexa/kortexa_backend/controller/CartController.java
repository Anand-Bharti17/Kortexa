package com.kortexa.kortexa_backend.controller;

import com.kortexa.kortexa_backend.dto.CartItemRequest;
import com.kortexa.kortexa_backend.model.Cart;
import com.kortexa.kortexa_backend.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    // 1. View the Cart
    @GetMapping
    public ResponseEntity<Cart> getCart(Principal principal) {
        // Principal automatically holds the logged-in user's email from their JWT!
        Cart cart = cartService.getOrCreateCart(principal.getName());
        return ResponseEntity.ok(cart);
    }

    // 2. Add an Item to the Cart
    @PostMapping("/add")
    public ResponseEntity<Cart> addItemToCart(
            @Valid @RequestBody CartItemRequest request,
            Principal principal) {

        Cart updatedCart = cartService.addItemToCart(principal.getName(), request);
        return ResponseEntity.ok(updatedCart);
    }

    // 3. Remove an Item completely from the Cart
    @DeleteMapping("/remove/{productId}")
    public ResponseEntity<Cart> removeItemFromCart(
            @PathVariable Long productId,
            Principal principal) {

        Cart updatedCart = cartService.removeItemFromCart(principal.getName(), productId);
        return ResponseEntity.ok(updatedCart);
    }
}