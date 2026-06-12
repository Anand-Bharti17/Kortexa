package com.kortexa.kortexa_backend.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ProductVariantDto {
    private Long id;
    private String label;
    private String size;
    private String color;
    private Integer stockQuantity;
    private BigDecimal priceAdjustment;
    private BigDecimal effectivePrice;
}
