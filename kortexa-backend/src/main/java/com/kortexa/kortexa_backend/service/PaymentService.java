package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.model.Order;
import com.kortexa.kortexa_backend.model.OrderStatus;
import com.kortexa.kortexa_backend.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final OrderRepository orderRepository;
    private final RazorpayPaymentService razorpayPaymentService;
    private final LedgerService ledgerService;

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

        // 4. Process through the dummy Razorpay service
        String transactionId = razorpayPaymentService.processDummyPayment(order, cardNumber);

        // 5. Payment Succeeded! Update the order status to PAID
        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);
        
        // 6. Trigger Ledger & Payouts processing for the paid order
        ledgerService.processOrderPayout(order);

        log.info("Payment successful via Razorpay: orderId={}, customer={}, transactionId={}", orderId, customerEmail, transactionId);
        return transactionId;
    }
}