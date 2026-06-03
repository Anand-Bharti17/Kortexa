package com.kortexa.kortexa_backend.dto;

import com.kortexa.kortexa_backend.model.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record VendorOrderSummary(
        Long orderId,
        OrderStatus status,
        LocalDateTime orderDate,
        String customerEmail,
        BigDecimal vendorSubtotal,
        List<VendorOrderLine> lines
) {
    public record VendorOrderLine(
            Long orderItemId,
            String productName,
            int quantity,
            BigDecimal lineTotal
    ) {}
}
