package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.model.Product;
import com.kortexa.kortexa_backend.model.User;
import com.kortexa.kortexa_backend.model.WishlistItem;
import com.kortexa.kortexa_backend.repository.ProductRepository;
import com.kortexa.kortexa_backend.repository.UserRepository;
import com.kortexa.kortexa_backend.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public List<Product> getWishlistProducts(String userEmail) {
        return wishlistRepository.findByUserEmailOrderByCreatedAtDesc(userEmail).stream()
                .map(WishlistItem::getProduct)
                .toList();
    }

    public List<Long> getWishlistProductIds(String userEmail) {
        return wishlistRepository.findByUserEmailOrderByCreatedAtDesc(userEmail).stream()
                .map(item -> item.getProduct().getId())
                .toList();
    }

    @Transactional
    public void addToWishlist(String userEmail, Long productId) {
        if (wishlistRepository.existsByUserEmailAndProductId(userEmail, productId)) {
            return;
        }
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        wishlistRepository.save(WishlistItem.builder().user(user).product(product).build());
    }

    @Transactional
    public void removeFromWishlist(String userEmail, Long productId) {
        wishlistRepository.deleteByUserEmailAndProductId(userEmail, productId);
    }

    public boolean isInWishlist(String userEmail, Long productId) {
        return wishlistRepository.existsByUserEmailAndProductId(userEmail, productId);
    }
}
