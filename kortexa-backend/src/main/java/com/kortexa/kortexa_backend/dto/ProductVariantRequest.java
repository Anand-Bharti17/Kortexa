package com.kortexa.kortexa_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductVariantRequest {
    @NotBlank
    private String label;
    private String size;
    private String color;
    @NotNull
    @PositiveOrZero
    private Integer stockQuantity;
    @PositiveOrZero
    private BigDecimal priceAdjustment;
}
