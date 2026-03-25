package com.kortexa.kortexa_backend.controller;

import com.kortexa.kortexa_backend.dto.PaymentRequest;
import com.kortexa.kortexa_backend.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/charge")
    public ResponseEntity<Map<String, String>> chargeCard(
            @Valid @RequestBody PaymentRequest request,
            Principal principal) {

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