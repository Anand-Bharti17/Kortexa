package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.model.Order;
import com.kortexa.kortexa_backend.model.OrderStatus;
import com.kortexa.kortexa_backend.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final OrderRepository orderRepository;

    @Transactional
    public String processPayment(Long orderId, String cardNumber, String customerEmail) {
        log.info("Payment initiated: orderId={}, customer={}", orderId, customerEmail);

        // 1. Find the order
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> {
                    log.warn("Payment failed - order not found: orderId={}", orderId);
                    return new IllegalArgumentException("Order not found");
                });

        // 2. Security Check
        if (!order.getCustomer().getEmail().equals(customerEmail)) {
            log.warn("Payment authorization failure: customer={} attempted to pay for orderId={} owned by {}",
                    customerEmail, orderId, order.getCustomer().getEmail());
            throw new SecurityException("You do not have permission to pay for this order");
        }

        // 3. State Check
        if (order.getStatus() != OrderStatus.PENDING) {
            log.warn("Payment failed - order is not in PENDING state: orderId={}, currentStatus={}", orderId, order.getStatus());
            throw new IllegalStateException("Order has already been processed or cancelled");
        }

        // 4. THE STRIPE STUB
        String cleanCardNumber = cardNumber.replace(" ", "");

        if (!"4242424242424242".equals(cleanCardNumber)) {
            log.warn("Payment declined - invalid card number for orderId={}, customer={}", orderId, customerEmail);
            throw new IllegalArgumentException("Payment Declined: Invalid card number or insufficient funds.");
        }

        // 5. Payment Succeeded! Update the order status to PAID
        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);

        // 6. Generate Transaction ID
        String transactionId = "ch_" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        log.info("Payment successful: orderId={}, customer={}, transactionId={}", orderId, customerEmail, transactionId);
        return transactionId;
    }
}