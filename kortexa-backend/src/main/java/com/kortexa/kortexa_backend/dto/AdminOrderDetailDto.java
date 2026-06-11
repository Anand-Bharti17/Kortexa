package com.kortexa.kortexa_backend.dto;

import com.kortexa.kortexa_backend.model.OrderStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AdminOrderDetailDto {

    private Long orderId;
    private OrderStatus status;
    private LocalDateTime orderDate;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private String couponCode;

    private Long customerId;
    private String customerEmail;
    private String customerName;

    private String shippingSummary;

    private List<AdminOrderItemDto> items;
}
