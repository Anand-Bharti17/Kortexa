package com.kortexa.kortexa_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RazorpayPaymentConfirmation {

    @NotBlank(message = "Razorpay payment ID is required")
    private String razorpayPaymentId;

    private String razorpayOrderId;
    private String razorpaySignature;
}
