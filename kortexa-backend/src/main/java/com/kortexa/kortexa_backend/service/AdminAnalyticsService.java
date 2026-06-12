package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.dto.AdminPlatformOverviewDto;
import com.kortexa.kortexa_backend.dto.CategoryRevenueDto;
import com.kortexa.kortexa_backend.dto.DailyOrderStatDto;
import com.kortexa.kortexa_backend.model.AccountStatus;
import com.kortexa.kortexa_backend.model.OrderStatus;
import com.kortexa.kortexa_backend.model.Role;
import com.kortexa.kortexa_backend.repository.OrderItemRepository;
import com.kortexa.kortexa_backend.repository.OrderRepository;
import com.kortexa.kortexa_backend.repository.ProductRepository;
import com.kortexa.kortexa_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminAnalyticsService {

    private static final BigDecimal COMMISSION_RATE = new BigDecimal("0.10");
    private static final List<OrderStatus> PAID_STATUSES = List.of(
            OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public AdminPlatformOverviewDto getOverview() {
        BigDecimal totalGmv = orderRepository.sumTotalAmountByStatusIn(PAID_STATUSES);
        if (totalGmv == null) {
            totalGmv = BigDecimal.ZERO;
        }

        BigDecimal revenueToday = orderRepository.sumRevenueToday();
        if (revenueToday == null) {
            revenueToday = BigDecimal.ZERO;
        }

        return AdminPlatformOverviewDto.builder()
                .totalGmv(totalGmv)
                .revenueToday(revenueToday)
                .estimatedCommission(totalGmv.multiply(COMMISSION_RATE).setScale(2, RoundingMode.HALF_UP))
                .totalOrders(orderRepository.countByStatusIn(PAID_STATUSES))
                .ordersToday(orderRepository.countOrdersToday())
                .totalCustomers(userRepository.countByRole(Role.CUSTOMER))
                .totalProducts(productRepository.count())
                .activeVendors(userRepository.countByRoleAndStatus(Role.VENDOR, AccountStatus.ACTIVE))
                .lastSevenDays(buildDailyStats())
                .topCategories(buildTopCategories())
                .build();
    }

    private List<DailyOrderStatDto> buildDailyStats() {
        List<DailyOrderStatDto> stats = new ArrayList<>();
        for (Object[] row : orderRepository.dailyOrderStatsLastSevenDays()) {
            LocalDate day = toLocalDate(row[0]);
            long count = ((Number) row[1]).longValue();
            BigDecimal revenue = row[2] instanceof BigDecimal bd
                    ? bd
                    : BigDecimal.valueOf(((Number) row[2]).doubleValue());
            stats.add(DailyOrderStatDto.builder()
                    .date(day)
                    .orderCount(count)
                    .revenue(revenue)
                    .build());
        }
        return stats;
    }

    private List<CategoryRevenueDto> buildTopCategories() {
        List<CategoryRevenueDto> categories = new ArrayList<>();
        for (Object[] row : orderItemRepository.findTopCategoryRevenue(PageRequest.of(0, 6))) {
            String category = (String) row[0];
            BigDecimal revenue = row[1] instanceof BigDecimal bd
                    ? bd
                    : BigDecimal.valueOf(((Number) row[1]).doubleValue());
            long units = ((Number) row[2]).longValue();
            categories.add(CategoryRevenueDto.builder()
                    .category(category)
                    .revenue(revenue)
                    .unitsSold(units)
                    .build());
        }
        return categories;
    }

    private LocalDate toLocalDate(Object value) {
        if (value instanceof Date sqlDate) {
            return sqlDate.toLocalDate();
        }
        if (value instanceof LocalDate localDate) {
            return localDate;
        }
        return LocalDate.parse(value.toString());
    }
}
