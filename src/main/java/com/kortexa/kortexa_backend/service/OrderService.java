package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.model.*;
import com.kortexa.kortexa_backend.repository.CartRepository;
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
    private final EmailService emailService;

    // NEW: Inject the CartRepository so we can read and empty the cart
    private final CartRepository cartRepository;

    @Transactional
    public Order checkoutCart(String customerEmail) {
        // 1. Find the customer and their cart
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));

        Cart cart = cartRepository.findByUserEmail(customerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Cart not found"));

        if (cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cannot checkout an empty cart!");
        }

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
                throw new IllegalArgumentException("Insufficient stock for product: " + product.getName());
            }

            // Deduct the inventory from the actual store
            product.setStockQuantity(product.getStockQuantity() - cartItem.getQuantity());
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

        // 5. THE MAGIC STEP: Empty the shopping cart now that they bought it!
        cart.getItems().clear();
        cart.setTotalPrice(BigDecimal.ZERO);
        cartRepository.save(cart);

        // 6. THE NEW STEP: Send the confirmation email!
        emailService.sendOrderConfirmation(customerEmail, savedOrder.getId(), savedOrder.getTotalAmount().toString());

        return savedOrder;
    }

    public List<Order> getCustomerOrders(String customerEmail) {
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        // Assuming you have this custom query in your OrderRepository!
        return orderRepository.findByCustomer_IdOrderByOrderDateDesc(customer.getId());
    }
}