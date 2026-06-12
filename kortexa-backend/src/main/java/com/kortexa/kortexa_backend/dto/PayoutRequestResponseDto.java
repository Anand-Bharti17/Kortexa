package com.kortexa.kortexa_backend.dto;

import com.kortexa.kortexa_backend.model.PayoutRequestStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PayoutRequestResponseDto {
    private Long id;
    private String vendorEmail;
    private BigDecimal amount;
    private PayoutRequestStatus status;
    private String paymentNote;
    private String resolutionNote;
    private String resolvedByEmail;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
}
