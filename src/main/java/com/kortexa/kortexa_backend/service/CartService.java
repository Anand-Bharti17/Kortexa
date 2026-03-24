package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.dto.CartItemRequest;
import com.kortexa.kortexa_backend.model.Cart;
import com.kortexa.kortexa_backend.model.CartItem;
import com.kortexa.kortexa_backend.model.Product;
import com.kortexa.kortexa_backend.model.User;
import com.kortexa.kortexa_backend.repository.CartRepository;
import com.kortexa.kortexa_backend.repository.ProductRepository;
import com.kortexa.kortexa_backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    // 1. Get the user's cart (or create an empty one if it doesn't exist)
    public Cart getOrCreateCart(String email) {
        return cartRepository.findByUserEmail(email).orElseGet(() -> {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            Cart newCart = Cart.builder().user(user).build();
            return cartRepository.save(newCart);
        });
    }

    // 2. Add an item to the cart
    @Transactional
    public Cart addItemToCart(String email, CartItemRequest request) {
        Cart cart = getOrCreateCart(email);
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Check if the product is already in the cart
        Optional<CartItem> existingItem = cart.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(product.getId()))
                .findFirst();

        if (existingItem.isPresent()) {
            // If it's already there, just increase the quantity
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + request.getQuantity());
        } else {
            // Otherwise, create a new cart item
            CartItem newItem = CartItem.builder()
                    .product(product)
                    .quantity(request.getQuantity())
                    .build();
            cart.addItem(newItem);
        }

        recalculateTotal(cart);
        return cartRepository.save(cart);
    }

    // 3. Remove an item completely
    @Transactional
    public Cart removeItemFromCart(String email, Long productId) {
        Cart cart = getOrCreateCart(email);

        cart.getItems().removeIf(item -> item.getProduct().getId().equals(productId));

        recalculateTotal(cart);
        return cartRepository.save(cart);
    }

    // Helper method to keep the math accurate!
    private void recalculateTotal(Cart cart) {
        BigDecimal total = cart.getItems().stream()
                .map(item -> item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        cart.setTotalPrice(total);
    }
}