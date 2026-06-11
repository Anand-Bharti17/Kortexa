package com.kortexa.kortexa_backend.dto;

import com.kortexa.kortexa_backend.model.DiscountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CouponRequest {

    @NotBlank
    private String code;

    private String description;

    @NotNull
    private DiscountType discountType;

    @NotNull
    @Positive
    private BigDecimal discountValue;

    private BigDecimal minOrderAmount;

    private Integer maxUses;

    private boolean active = true;

    private LocalDateTime expiresAt;
}
