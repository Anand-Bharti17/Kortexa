package com.kortexa.kortexa_backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "carts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // One Customer gets One Cart
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // If the cart is deleted, delete all the items inside it too (CascadeType.ALL)
    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CartItem> items = new ArrayList<>();

    // We will update this automatically whenever an item is added or removed
    @Column(nullable = false)
    @Builder.Default
    private BigDecimal totalPrice = BigDecimal.ZERO;

    // Helper method to add items and keep the relationship in sync
    public void addItem(CartItem item) {
        items.add(item);
        item.setCart(this);
    }

    // Helper method to remove items
    public void removeItem(CartItem item) {
        items.remove(item);
        item.setCart(null);
    }
}