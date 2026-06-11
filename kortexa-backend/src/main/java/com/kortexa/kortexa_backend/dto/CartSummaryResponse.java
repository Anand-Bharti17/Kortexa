package com.kortexa.kortexa_backend.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class CartSummaryResponse {

    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal total;
    private String couponCode;
    private Long selectedAddressId;
}
