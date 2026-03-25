package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.model.*;
import com.kortexa.kortexa_backend.repository.CartRepository;
import com.kortexa.kortexa_backend.repository.OrderRepository;
import com.kortexa.kortexa_backend.repository.ProductRepository;
import com.kortexa.kortexa_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate; // NEW IMPORT
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
    private final CartRepository cartRepository;

    // REMOVED: private final EmailService emailService;
    // ADDED: Inject KafkaTemplate
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Transactional
    public Order checkoutCart(String customerEmail) {
        log.info("Checkout initiated for customer: {}", customerEmail);

        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));

        Cart cart = cartRepository.findByUserEmail(customerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Cart not found"));

        if (cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cannot checkout an empty cart!");
        }

        Order order = Order.builder()
                .customer(customer)
                .status(OrderStatus.PENDING)
                .totalAmount(cart.getTotalPrice())
                .items(new ArrayList<>())
                .build();

        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();

            if (product.getStockQuantity() < cartItem.getQuantity()) {
                throw new IllegalArgumentException("Insufficient stock for product: " + product.getName());
            }

            int updatedStock = product.getStockQuantity() - cartItem.getQuantity();
            product.setStockQuantity(updatedStock);
            productRepository.save(product);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(cartItem.getQuantity())
                    .priceAtPurchase(product.getPrice())
                    .build();

            order.getItems().add(orderItem);
        }

        Order savedOrder = orderRepository.save(order);
        log.info("Order created successfully: orderId={}", savedOrder.getId());

        cart.getItems().clear();
        cart.setTotalPrice(BigDecimal.ZERO);
        cartRepository.save(cart);

        // --- NEW KAFKA LOGIC ---
        // Construct a simple payload string separated by pipes (|)
        String kafkaPayload = customerEmail + "|" + savedOrder.getId() + "|" + savedOrder.getTotalAmount().toString();

        // Send the payload to the "order-emails" topic
        kafkaTemplate.send("order-emails", kafkaPayload);
        log.info("Dispatched email event to Kafka for orderId={}", savedOrder.getId());

        return savedOrder;
    }

    public List<Order> getCustomerOrders(String customerEmail) {
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        return orderRepository.findByCustomer_IdOrderByOrderDateDesc(customer.getId());
    }
}