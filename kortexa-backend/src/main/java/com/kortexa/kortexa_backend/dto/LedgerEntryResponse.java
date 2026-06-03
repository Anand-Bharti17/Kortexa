package com.kortexa.kortexa_backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record LedgerEntryResponse(
        Long id,
        String transactionType,
        BigDecimal amount,
        String referenceId,
        String description,
        LocalDateTime createdAt
) {}
