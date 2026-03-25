package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.model.*;
import com.kortexa.kortexa_backend.repository.CartRepository;
import com.kortexa.kortexa_backend.repository.OrderRepository;
import com.kortexa.kortexa_backend.repository.ProductRepository;
import com.kortexa.kortexa_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    // NEW: Inject the CartRepository so we can read and empty the cart
    private final CartRepository cartRepository;

    @Transactional
    public Order checkoutCart(String customerEmail) {
        log.info("Checkout initiated for customer: {}", customerEmail);

        // 1. Find the customer and their cart
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> {
                    log.warn("Checkout failed - customer not found: {}", customerEmail);
                    return new IllegalArgumentException("Customer not found");
                });

        Cart cart = cartRepository.findByUserEmail(customerEmail)
                .orElseThrow(() -> {
                    log.warn("Checkout failed - cart not found for customer: {}", customerEmail);
                    return new IllegalArgumentException("Cart not found");
                });

        if (cart.getItems().isEmpty()) {
            log.warn("Checkout failed - cart is empty for customer: {}", customerEmail);
            throw new IllegalArgumentException("Cannot checkout an empty cart!");
        }

        log.debug("Cart contains {} item(s) for customer: {}", cart.getItems().size(), customerEmail);

        // 2. Initialize the permanent Order
        Order order = Order.builder()
                .customer(customer)
                .status(OrderStatus.PENDING)
                .totalAmount(cart.getTotalPrice()) // We already calculated this in the cart!
                .items(new ArrayList<>())
                .build();

        // 3. Convert CartItems to OrderItems
        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();

            // Check if we still have enough stock
            if (product.getStockQuantity() < cartItem.getQuantity()) {
                log.warn("Checkout failed - insufficient stock: productId={}, productName='{}', available={}, requested={}",
                        product.getId(), product.getName(), product.getStockQuantity(), cartItem.getQuantity());
                throw new IllegalArgumentException("Insufficient stock for product: " + product.getName());
            }

            // Deduct the inventory from the actual store
            int updatedStock = product.getStockQuantity() - cartItem.getQuantity();
            log.debug("Deducting stock: productId={}, qty={}, remainingStock={}", product.getId(), cartItem.getQuantity(), updatedStock);
            product.setStockQuantity(updatedStock);
            productRepository.save(product);

            // Create the permanent receipt item
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(cartItem.getQuantity())
                    .priceAtPurchase(product.getPrice()) // Lock in the current price!
                    .build();

            order.getItems().add(orderItem);
        }

        // 4. Save the order (CascadeType.ALL saves the OrderItems too)
        Order savedOrder = orderRepository.save(order);
        log.info("Order created successfully: orderId={}, customer={}, total={}", savedOrder.getId(), customerEmail, savedOrder.getTotalAmount());

        // 5. THE MAGIC STEP: Empty the shopping cart now that they bought it!
        cart.getItems().clear();
        cart.setTotalPrice(BigDecimal.ZERO);
        cartRepository.save(cart);
        log.debug("Cart cleared for customer: {}", customerEmail);

        // 6. THE NEW STEP: Send the confirmation email!
        log.info("Sending order confirmation email to: {}", customerEmail);
        emailService.sendOrderConfirmation(customerEmail, savedOrder.getId(), savedOrder.getTotalAmount().toString());

        return savedOrder;
    }

    public List<Order> getCustomerOrders(String customerEmail) {
        log.debug("Fetching order history for customer: {}", customerEmail);
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> {
                    log.warn("Order history fetch failed - customer not found: {}", customerEmail);
                    return new IllegalArgumentException("Customer not found");
                });
        // Assuming you have this custom query in your OrderRepository!
        List<Order> orders = orderRepository.findByCustomer_IdOrderByOrderDateDesc(customer.getId());
        log.debug("Found {} order(s) for customer: {}", orders.size(), customerEmail);
        return orders;
    }
}