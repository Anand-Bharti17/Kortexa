package com.kortexa.kortexa_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorSalesStats {
    private BigDecimal totalRevenue;
    private Integer totalItemsSold;
    private List<ProductPerformance> itemizedPerformance;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductPerformance {
        private String productName;
        private Integer quantitySold;
        private BigDecimal totalRevenue;
    }
}
