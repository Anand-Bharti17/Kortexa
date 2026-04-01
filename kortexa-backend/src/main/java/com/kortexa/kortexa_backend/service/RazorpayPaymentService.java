package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.model.Order;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
public class RazorpayPaymentService {

    public String processDummyPayment(Order order, String cardNumber) {
        log.info("[Razorpay] Starting dummy payment for orderId={} amount={} customer={}",
                order.getId(), order.getTotalAmount(), order.getCustomer().getEmail());

        String cleanedCard = cardNumber.replaceAll("\\s+", "");
        if (!"4242424242424242".equals(cleanedCard)) {
            log.warn("[Razorpay] Dummy payment declined for orderId={} invalid card={}", order.getId(), cleanedCard);
            throw new IllegalArgumentException("Razorpay payment declined: invalid card number.");
        }

        String transactionId = "rp_" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        log.info("[Razorpay] Dummy payment succeeded for orderId={} transactionId={}", order.getId(), transactionId);
        return transactionId;
    }
}
