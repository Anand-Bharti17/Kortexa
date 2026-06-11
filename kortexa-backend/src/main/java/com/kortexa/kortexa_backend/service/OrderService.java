package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.dto.OrderStatusUpdateRequest;
import com.kortexa.kortexa_backend.dto.VendorOrderSummary;
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
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
    private final org.springframework.data.redis.core.StringRedisTemplate redisTemplate;
    private final LedgerService ledgerService;
    private final CartService cartService;
    private final ActivityService activityService;

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
                .status(OrderStatus.PENDING)
                .totalAmount(cart.getTotalPrice())
                .shippingAddress(cart.getSelectedAddress())
                .couponCode(cart.getCouponCode())
                .discountAmount(cart.getDiscountAmount())
                .items(new ArrayList<>())
                .build();

        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();
            
            // FLASH SALE LOCK: Prevent race conditions
            String lockKey = "lock:product:" + product.getId();
            Boolean locked = redisTemplate.opsForValue().setIfAbsent(lockKey, "locked", java.time.Duration.ofSeconds(5));
            
            if (Boolean.FALSE.equals(locked)) {
                log.warn("Flash sale traffic lock triggered for productId={}", product.getId());
                throw new IllegalStateException("High traffic for " + product.getName() + "! Please try checking out again in a few seconds.");
            }
            
            try {
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
            } finally {
                redisTemplate.delete(lockKey);
            }

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .quantity(cartItem.getQuantity())
                    .priceAtPurchase(product.getPrice())
                    .build();

            // Use the helper method for correct bidirectional linking!
            order.addOrderItem(orderItem);
        }

        Order savedOrder = orderRepository.save(order);
        log.info("Order created successfully: orderId={}, itemCount={}, totalAmount={}, customer={}",
                savedOrder.getId(), savedOrder.getItems().size(), savedOrder.getTotalAmount(), customerEmail);

        cartService.applyCouponUsageIfPresent(cart);
        cartService.clearCartAfterCheckout(cart);
        log.debug("Cart cleared after checkout: email={}", customerEmail);

        activityService.log(ActivityType.ORDER_PLACED, customerEmail, customer.getRole().name(),
                "Placed order #" + savedOrder.getId() + " for ₹" + savedOrder.getTotalAmount(),
                "ORDER", savedOrder.getId());

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

        // --- KAFKA PRODUCER: dispatch analytics event ---
        if (savedOrder.getItems().size() > 1) {
            String analyticsPayload = savedOrder.getItems().stream()
                    .map(item -> item.getProduct().getId().toString())
                    .collect(java.util.stream.Collectors.joining(","));
            kafkaTemplate.send("order-analytics", analyticsPayload);
        }

        return savedOrder;
    }

    @Transactional
    public Order checkoutCartAndPay(String customerEmail, String paymentReference) {
        log.info("Razorpay checkout completed; creating paid order for customer={}", customerEmail);

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

        log.info("Cart found for payment checkout: email={}, itemCount={}, total={}",
                customerEmail, cart.getItems().size(), cart.getTotalPrice());

        if (cart.getSelectedAddress() == null) {
            throw new IllegalArgumentException("Please select a shipping address before checkout");
        }

        Order order = Order.builder()
                .customer(customer)
                .status(OrderStatus.PAID)
                .totalAmount(cart.getTotalPrice())
                .shippingAddress(cart.getSelectedAddress())
                .couponCode(cart.getCouponCode())
                .discountAmount(cart.getDiscountAmount())
                .items(new ArrayList<>())
                .build();

        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();
            
            // FLASH SALE LOCK: Prevent race conditions
            String lockKey = "lock:product:" + product.getId();
            Boolean locked = redisTemplate.opsForValue().setIfAbsent(lockKey, "locked", java.time.Duration.ofSeconds(5));
            
            if (Boolean.FALSE.equals(locked)) {
                log.warn("Flash sale traffic lock triggered for productId={}", product.getId());
                throw new IllegalStateException("High traffic for " + product.getName() + "! Please try checking out again in a few seconds.");
            }
            
            try {
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
            } finally {
                redisTemplate.delete(lockKey);
            }

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .quantity(cartItem.getQuantity())
                    .priceAtPurchase(product.getPrice())
                    .build();

            order.addOrderItem(orderItem);
        }

        Order savedOrder = orderRepository.save(order);
        log.info("Paid order created successfully: orderId={}, itemCount={}, totalAmount={}, customer={}, paymentReference={}",
                savedOrder.getId(), savedOrder.getItems().size(), savedOrder.getTotalAmount(), customerEmail, paymentReference);

        cartService.applyCouponUsageIfPresent(cart);
        cartService.clearCartAfterCheckout(cart);
        log.debug("Cart cleared after paid checkout: email={}", customerEmail);

        activityService.log(ActivityType.ORDER_PAID, customerEmail, customer.getRole().name(),
                "Paid order #" + savedOrder.getId() + " (₹" + savedOrder.getTotalAmount() + ")",
                "ORDER", savedOrder.getId());

        String kafkaPayload = customerEmail + "|" + savedOrder.getId() + "|" + savedOrder.getTotalAmount().toString();
        log.info("[KAFKA PRODUCER] Sending paid order event to topic='order-emails': orderId={}, customer={}",
                savedOrder.getId(), customerEmail);

        kafkaTemplate.send("order-emails", kafkaPayload)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("[KAFKA PRODUCER] Failed to deliver paid order event to topic='order-emails': orderId={}, error={}",
                                savedOrder.getId(), ex.getMessage(), ex);
                    } else {
                        log.info("[KAFKA PRODUCER] Paid order event delivered successfully: orderId={}, topic={}, partition={}, offset={}",
                                savedOrder.getId(),
                                result.getRecordMetadata().topic(),
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset());
                    }
                });

        if (savedOrder.getItems().size() > 1) {
            String analyticsPayload = savedOrder.getItems().stream()
                    .map(item -> item.getProduct().getId().toString())
                    .collect(java.util.stream.Collectors.joining(","));
            kafkaTemplate.send("order-analytics", analyticsPayload);
        }

        // Trigger Ledger Payout since the order is PAID
        ledgerService.processOrderPayout(savedOrder);

        return savedOrder;
    }

    public List<Order> getCustomerOrders(String customerEmail) {
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        return orderRepository.findByCustomer_IdOrderByOrderDateDesc(customer.getId());
    }

    public VendorSalesStats getVendorStats(String vendorEmail) {
        String searchEmail = (vendorEmail != null) ? vendorEmail.trim().toLowerCase() : "";
        log.info("DIAGNOSTIC: Fetching stats for vendorEmail='{}'", searchEmail);
        
        // Use the updated repository method
        List<OrderItem> vendorItems = orderItemRepository.findByVendorEmailIgnoreCase(searchEmail);
        log.info("DIAGNOSTIC: Found {} vendor items in database for email='{}'", vendorItems.size(), searchEmail);

        BigDecimal totalRevenue = BigDecimal.ZERO;
        int totalItemsSold = 0;
        java.util.Map<String, VendorSalesStats.ProductPerformance> performanceMap = new java.util.HashMap<>();

        for (OrderItem item : vendorItems) {
            Order order = item.getOrder();
            if (order == null) {
                log.warn("DIAGNOSTIC: Found OrderItem(id={}) with null parent order!", item.getId());
                continue;
            }

            // For stats, we include everything that isn't cancelled
            if (order.getStatus() == OrderStatus.CANCELLED) {
                log.debug("DIAGNOSTIC: Skipping cancelled order item (id={})", item.getId());
                continue;
            }

            BigDecimal itemRevenue = item.getPriceAtPurchase().multiply(new BigDecimal(item.getQuantity()));
            totalRevenue = totalRevenue.add(itemRevenue);
            totalItemsSold += item.getQuantity();

            String productName = item.getProduct() != null ? item.getProduct().getName() : "Unknown Product";
            VendorSalesStats.ProductPerformance perf = performanceMap.getOrDefault(productName,
                    VendorSalesStats.ProductPerformance.builder()
                            .productName(productName)
                            .quantitySold(0)
                            .totalRevenue(BigDecimal.ZERO)
                            .build());

            perf.setQuantitySold(perf.getQuantitySold() + item.getQuantity());
            perf.setTotalRevenue(perf.getTotalRevenue().add(itemRevenue));
            performanceMap.put(productName, perf);
            
            log.info("DIAGNOSTIC: Processed item {} from Order {} - Revenue: {}", item.getId(), order.getId(), itemRevenue);
        }

        log.info("DIAGNOSTIC: Stats summary for '{}': totalItemsSold={}, totalRevenue={}", searchEmail, totalItemsSold, totalRevenue);

        return VendorSalesStats.builder()
                .totalRevenue(totalRevenue)
                .totalItemsSold(totalItemsSold)
                .itemizedPerformance(new ArrayList<>(performanceMap.values()))
                .build();
    }

    public List<VendorOrderSummary> getVendorFulfillmentOrders(String vendorEmail) {
        String email = vendorEmail.trim().toLowerCase();
        List<OrderItem> vendorItems = orderItemRepository.findByVendorEmailIgnoreCase(email);

        Map<Long, VendorOrderSummary> byOrder = new LinkedHashMap<>();

        for (OrderItem item : vendorItems) {
            Order order = item.getOrder();
            if (order == null || order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.PENDING) {
                continue;
            }

            BigDecimal lineTotal = item.getPriceAtPurchase().multiply(BigDecimal.valueOf(item.getQuantity()));
            VendorOrderSummary.VendorOrderLine line = new VendorOrderSummary.VendorOrderLine(
                    item.getId(),
                    item.getProduct() != null ? item.getProduct().getName() : "Product",
                    item.getQuantity(),
                    lineTotal);

            byOrder.compute(order.getId(), (id, existing) -> {
                if (existing == null) {
                    return new VendorOrderSummary(
                            order.getId(),
                            order.getStatus(),
                            order.getOrderDate(),
                            order.getCustomer().getEmail(),
                            lineTotal,
                            new ArrayList<>(List.of(line)));
                }
                List<VendorOrderSummary.VendorOrderLine> lines = new ArrayList<>(existing.lines());
                lines.add(line);
                return new VendorOrderSummary(
                        existing.orderId(),
                        existing.status(),
                        existing.orderDate(),
                        existing.customerEmail(),
                        existing.vendorSubtotal().add(lineTotal),
                        lines);
            });
        }

        return byOrder.values().stream()
                .sorted(Comparator.comparing(VendorOrderSummary::orderDate).reversed())
                .toList();
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, String vendorEmail, OrderStatusUpdateRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        String email = vendorEmail.trim().toLowerCase();
        boolean ownsOrder = order.getItems().stream()
                .anyMatch(item -> item.getProduct() != null
                        && item.getProduct().getVendor() != null
                        && email.equalsIgnoreCase(item.getProduct().getVendor().getEmail()));

        if (!ownsOrder) {
            throw new SecurityException("You cannot update this order");
        }

        OrderStatus current = order.getStatus();
        OrderStatus next = request.status();

        boolean validTransition = (current == OrderStatus.PAID && next == OrderStatus.SHIPPED)
                || (current == OrderStatus.SHIPPED && next == OrderStatus.DELIVERED);

        if (!validTransition) {
            throw new IllegalArgumentException(
                    "Invalid status transition from " + current + " to " + next);
        }

        order.setStatus(next);
        Order saved = orderRepository.save(order);

        String customerEmail = order.getCustomer().getEmail();
        activityService.log(ActivityType.ORDER_STATUS_CHANGED, vendorEmail, "VENDOR",
                "Order #" + orderId + " updated to " + next,
                "ORDER", orderId);

        String statusPayload = customerEmail + "|" + orderId + "|" + next + "|" + order.getTotalAmount();
        kafkaTemplate.send("order-status-emails", statusPayload);

        return saved;
    }
}