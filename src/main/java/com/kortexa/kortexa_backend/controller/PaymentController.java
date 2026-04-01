package com.kortexa.kortexa_backend.controller;

import com.kortexa.kortexa_backend.dto.PaymentRequest;
import com.kortexa.kortexa_backend.dto.RazorpayOrderResponse;
import com.kortexa.kortexa_backend.repository.CartRepository;
import com.kortexa.kortexa_backend.service.PaymentService;
import com.kortexa.kortexa_backend.service.RazorpayGatewayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final CartRepository cartRepository;
    private final RazorpayGatewayService razorpayGatewayService;

    @GetMapping("/razorpay/order")
    public ResponseEntity<RazorpayOrderResponse> createRazorpayOrder(Principal principal) {
        String email = principal.getName();
        var cart = cartRepository.findByUserEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Cart not found"));
        if (cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }
        Long amountInPaise = cart.getTotalPrice().multiply(BigDecimal.valueOf(100)).longValue();
        RazorpayOrderResponse razorpayOrder = razorpayGatewayService.createOrder(amountInPaise, "INR");
        return ResponseEntity.ok(razorpayOrder);
    }

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