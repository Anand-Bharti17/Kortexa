package com.kortexa.kortexa_backend.controller;

import com.kortexa.kortexa_backend.dto.RazorpayPaymentConfirmation;
import com.kortexa.kortexa_backend.dto.VendorSalesStats;
import com.kortexa.kortexa_backend.model.Order;
import com.kortexa.kortexa_backend.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // 1. Convert the current Cart into a final Order
    @PostMapping("/checkout")
    public ResponseEntity<Order> checkoutCart(Principal principal) {
        log.info("Checkout request received: user={}", principal.getName());
        Order completedOrder = orderService.checkoutCart(principal.getName());
        return ResponseEntity.ok(completedOrder);
    }

    @PostMapping("/checkout/razorpay")
    public ResponseEntity<Order> checkoutCartWithRazorpay(
            @Valid @RequestBody RazorpayPaymentConfirmation paymentConfirmation,
            Principal principal) {
        log.info("Razorpay checkout confirmation received: user={}", principal.getName());
        Order completedOrder = orderService.checkoutCartAndPay(principal.getName(), paymentConfirmation.getRazorpayPaymentId());
        return ResponseEntity.ok(completedOrder);
    }

    // 2. View Order History
    @GetMapping("/history")
    public ResponseEntity<List<Order>> getOrderHistory(Principal principal) {
        log.debug("Order history request: user={}", principal.getName());
        List<Order> history = orderService.getCustomerOrders(principal.getName());
        return ResponseEntity.ok(history);
    }

    @GetMapping("/vendor/stats")
    public ResponseEntity<VendorSalesStats> getVendorStats(Principal principal) {
        log.info("Vendor stats request: vendor={}", principal.getName());
        VendorSalesStats stats = orderService.getVendorStats(principal.getName());
        return ResponseEntity.ok(stats);
    }
}