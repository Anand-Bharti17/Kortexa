package com.kortexa.kortexa_backend.controller;

import com.kortexa.kortexa_backend.model.Order;
import com.kortexa.kortexa_backend.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // 1. Convert the current Cart into a final Order
    @PostMapping("/checkout")
    public ResponseEntity<Order> checkoutCart(Principal principal) {
        Order completedOrder = orderService.checkoutCart(principal.getName());
        return ResponseEntity.ok(completedOrder);
    }

    // 2. View Order History
    @GetMapping("/history")
    public ResponseEntity<List<Order>> getOrderHistory(Principal principal) {
        List<Order> history = orderService.getCustomerOrders(principal.getName());
        return ResponseEntity.ok(history);
    }
}