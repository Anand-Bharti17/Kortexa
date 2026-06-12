package com.kortexa.kortexa_backend.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class AdminPlatformOverviewDto {
    private BigDecimal totalGmv;
    private BigDecimal revenueToday;
    private BigDecimal estimatedCommission;
    private long totalOrders;
    private long ordersToday;
    private long totalCustomers;
    private long totalProducts;
    private long activeVendors;
    private List<DailyOrderStatDto> lastSevenDays;
    private List<CategoryRevenueDto> topCategories;
}
