package com.kortexa.kortexa_backend.dto;

import java.math.BigDecimal;
import java.util.List;

public record VendorSettlementResponse(
        BigDecimal walletBalance,
        BigDecimal platformCommissionRate,
        List<LedgerEntryResponse> recentTransactions
) {}
