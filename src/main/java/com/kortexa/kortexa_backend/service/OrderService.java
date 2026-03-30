package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.dto.VendorSalesStats;
import com.kortexa.kortexa_backend.model.*;
import com.kortexa.kortexa_backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
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
    private final OrderItemRepository orderItemRepository;

    // REMOVED: private final EmailService emailService;
    // ADDED: Inject KafkaTemplate
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Transactional
    public Order checkoutCart(String customerEmail) {
        log.info("Checkout initiated for customer: {}", customerEmail);

        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> {
                    log.warn("Checkout failed - customer not found: email={}", customerEmail);
                    return new IllegalArgumentException("Customer not found");
                });

        Cart cart = cartRepository.findByUserEmail(customerEmail)
                .orElseThrow(() -> {
                    log.warn("Checkout failed - cart not found for customer: email={}", customerEmail);
                    return new IllegalArgumentException("Cart not found");
                });

        if (cart.getItems().isEmpty()) {
            log.warn("Checkout aborted - cart is empty for customer: email={}", customerEmail);
            throw new IllegalArgumentException("Cannot checkout an empty cart!");
        }

        log.info("Cart found for checkout: email={}, itemCount={}, total={}",
                customerEmail, cart.getItems().size(), cart.getTotalPrice());

        Order order = Order.builder()
                .customer(customer)
                .status(OrderStatus.COMPLETED)
                .totalAmount(cart.getTotalPrice())
                .items(new ArrayList<>())
                .build();

        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();

            if (product.getStockQuantity() < cartItem.getQuantity()) {
                log.warn("Checkout failed - insufficient stock: productId={}, productName='{}', requested={}, available={}",
                        product.getId(), product.getName(), cartItem.getQuantity(), product.getStockQuantity());
                throw new IllegalArgumentException("Insufficient stock for product: " + product.getName());
            }

            int updatedStock = product.getStockQuantity() - cartItem.getQuantity();
            product.setStockQuantity(updatedStock);
            productRepository.save(product);
            log.debug("Stock updated: productId={}, productName='{}', qty={}, remainingStock={}",
                    product.getId(), product.getName(), cartItem.getQuantity(), updatedStock);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(cartItem.getQuantity())
                    .priceAtPurchase(product.getPrice())
                    .build();

            order.getItems().add(orderItem);
        }

        Order savedOrder = orderRepository.save(order);
        log.info("Order created successfully: orderId={}, itemCount={}, totalAmount={}, customer={}",
                savedOrder.getId(), savedOrder.getItems().size(), savedOrder.getTotalAmount(), customerEmail);

        cart.getItems().clear();
        cart.setTotalPrice(BigDecimal.ZERO);
        cartRepository.save(cart);
        log.debug("Cart cleared after checkout: email={}", customerEmail);

        // --- KAFKA PRODUCER: dispatch email notification event ---
        String kafkaPayload = customerEmail + "|" + savedOrder.getId() + "|" + savedOrder.getTotalAmount().toString();
        log.info("[KAFKA PRODUCER] Sending order event to topic='order-emails': orderId={}, customer={}",
                savedOrder.getId(), customerEmail);

        kafkaTemplate.send("order-emails", kafkaPayload)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("[KAFKA PRODUCER] Failed to deliver order event to topic='order-emails': orderId={}, error={}",
                                savedOrder.getId(), ex.getMessage(), ex);
                    } else {
                        log.info("[KAFKA PRODUCER] Order event delivered successfully: orderId={}, topic={}, partition={}, offset={}",
                                savedOrder.getId(),
                                result.getRecordMetadata().topic(),
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset());
                    }
                });

        return savedOrder;
    }

    public List<Order> getCustomerOrders(String customerEmail) {
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        return orderRepository.findByCustomer_IdOrderByOrderDateDesc(customer.getId());
    }

    public VendorSalesStats getVendorStats(String vendorEmail) {
        log.info("Fetching sales stats for vendor: {}", vendorEmail);
        List<OrderItem> vendorItems = orderItemRepository.findByProduct_Vendor_Email(vendorEmail);

        BigDecimal totalRevenue = BigDecimal.ZERO;
        int totalItemsSold = 0;
        java.util.Map<String, VendorSalesStats.ProductPerformance> performanceMap = new java.util.HashMap<>();

        for (OrderItem item : vendorItems) {
            BigDecimal itemRevenue = item.getPriceAtPurchase().multiply(new BigDecimal(item.getQuantity()));
            totalRevenue = totalRevenue.add(itemRevenue);
            totalItemsSold += item.getQuantity();

            String productName = item.getProduct().getName();
            VendorSalesStats.ProductPerformance perf = performanceMap.getOrDefault(productName,
                    VendorSalesStats.ProductPerformance.builder()
                            .productName(productName)
                            .quantitySold(0)
                            .totalRevenue(BigDecimal.ZERO)
                            .build());

            perf.setQuantitySold(perf.getQuantitySold() + item.getQuantity());
            perf.setTotalRevenue(perf.getTotalRevenue().add(itemRevenue));
            performanceMap.put(productName, perf);
        }

        return VendorSalesStats.builder()
                .totalRevenue(totalRevenue)
                .totalItemsSold(totalItemsSold)
                .itemizedPerformance(new ArrayList<>(performanceMap.values()))
                .build();
    }
}