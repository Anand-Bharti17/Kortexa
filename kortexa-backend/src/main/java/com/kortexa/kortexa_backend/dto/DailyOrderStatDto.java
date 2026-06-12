package com.kortexa.kortexa_backend.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class DailyOrderStatDto {
    private LocalDate date;
    private long orderCount;
    private BigDecimal revenue;
}
