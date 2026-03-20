package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.dto.OrderItemRequest;
import com.kortexa.kortexa_backend.dto.OrderRequest;
import com.kortexa.kortexa_backend.model.*;
import com.kortexa.kortexa_backend.repository.OrderRepository;
import com.kortexa.kortexa_backend.repository.ProductRepository;
import com.kortexa.kortexa_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional // Ensures the whole process succeeds, or rolls back entirely
    public Order placeOrder(OrderRequest request, String customerEmail) {

        // 1. Find the customer
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));

        // 2. Initialize an empty Order
        Order order = Order.builder()
                .customer(customer)
                .status(OrderStatus.PENDING)
                .items(new ArrayList<>())
                .build();

        BigDecimal totalAmount = BigDecimal.ZERO;

        // 3. Process each item in the shopping cart
        for (OrderItemRequest itemRequest : request.items()) {
            Product product = productRepository.findById(itemRequest.productId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found with ID: " + itemRequest.productId()));

            // Check if we have enough stock!
            if (product.getStockQuantity() < itemRequest.quantity()) {
                throw new IllegalArgumentException("Insufficient stock for product: " + product.getName());
            }

            // Deduct the inventory
            product.setStockQuantity(product.getStockQuantity() - itemRequest.quantity());
            productRepository.save(product);

            // Create the OrderItem
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(itemRequest.quantity())
                    .priceAtPurchase(product.getPrice()) // Lock in the current price
                    .build();

            order.getItems().add(orderItem);

            // Calculate subtotal and add to grand total
            BigDecimal subtotal = product.getPrice().multiply(BigDecimal.valueOf(itemRequest.quantity()));
            totalAmount = totalAmount.add(subtotal);
        }

        order.setTotalAmount(totalAmount);

        // 4. Save the order (CascadeType.ALL will automatically save the OrderItems too!)
        return orderRepository.save(order);
    }

    public List<Order> getCustomerOrders(String customerEmail) {
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        return orderRepository.findByCustomerId(customer.getId());
    }
}