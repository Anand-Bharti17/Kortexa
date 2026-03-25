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
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    // 1. Get the user's cart (or create an empty one if it doesn't exist)
    public Cart getOrCreateCart(String email) {
        return cartRepository.findByUserEmail(email).orElseGet(() -> {
            log.info("No existing cart found for user: {}. Creating a new cart.", email);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            Cart newCart = Cart.builder().user(user).build();
            Cart saved = cartRepository.save(newCart);
            log.debug("New cart created with id={} for user={}", saved.getId(), email);
            return saved;
        });
    }

    // 2. Add an item to the cart
    @Transactional
    public Cart addItemToCart(String email, CartItemRequest request) {
        log.info("Adding item to cart: user={}, productId={}, quantity={}", email, request.getProductId(), request.getQuantity());
        Cart cart = getOrCreateCart(email);
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> {
                    log.warn("Add to cart failed - product not found: productId={}", request.getProductId());
                    return new RuntimeException("Product not found");
                });

        // Check if the product is already in the cart
        Optional<CartItem> existingItem = cart.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(product.getId()))
                .findFirst();

        if (existingItem.isPresent()) {
            // If it's already there, just increase the quantity
            CartItem item = existingItem.get();
            int newQty = item.getQuantity() + request.getQuantity();
            log.debug("Product already in cart. Updating quantity: productId={}, oldQty={}, newQty={}", product.getId(), item.getQuantity(), newQty);
            item.setQuantity(newQty);
        } else {
            // Otherwise, create a new cart item
            log.debug("Adding new item to cart: productId={}, quantity={}", product.getId(), request.getQuantity());
            CartItem newItem = CartItem.builder()
                    .product(product)
                    .quantity(request.getQuantity())
                    .build();
            cart.addItem(newItem);
        }

        recalculateTotal(cart);
        Cart savedCart = cartRepository.save(cart);
        log.info("Cart updated for user={}, total={}", email, savedCart.getTotalPrice());
        return savedCart;
    }

    // 3. Remove an item completely
    @Transactional
    public Cart removeItemFromCart(String email, Long productId) {
        log.info("Removing item from cart: user={}, productId={}", email, productId);
        Cart cart = getOrCreateCart(email);

        boolean removed = cart.getItems().removeIf(item -> item.getProduct().getId().equals(productId));
        if (removed) {
            log.debug("Item removed from cart: user={}, productId={}", email, productId);
        } else {
            log.warn("Remove item requested but productId={} was not found in cart for user={}", productId, email);
        }

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