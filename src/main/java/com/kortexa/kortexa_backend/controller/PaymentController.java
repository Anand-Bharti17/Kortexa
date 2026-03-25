package com.kortexa.kortexa_backend.controller;

import com.kortexa.kortexa_backend.dto.PaymentRequest;
import com.kortexa.kortexa_backend.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/charge")
    public ResponseEntity<Map<String, String>> chargeCard(
            @Valid @RequestBody PaymentRequest request,
            Principal principal) {
        log.info("Payment charge request: user={}, orderId={}", principal.getName(), request.getOrderId());
        String transactionId = paymentService.processPayment(
                request.getOrderId(),
                request.getCardNumber(),
                principal.getName()
        );

        // Return a professional-looking JSON receipt
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "transactionId", transactionId,
                "message", "Payment processed successfully. Order is now PAID."
        ));
    }
}