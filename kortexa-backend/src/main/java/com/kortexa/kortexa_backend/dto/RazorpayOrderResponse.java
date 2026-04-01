package com.kortexa.kortexa_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RazorpayOrderResponse {
    private String key;
    private String orderId;
    private Long amount;
    private String currency;
}
