package com.kortexa.kortexa_backend.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class CategoryRevenueDto {
    private String category;
    private BigDecimal revenue;
    private long unitsSold;
}
