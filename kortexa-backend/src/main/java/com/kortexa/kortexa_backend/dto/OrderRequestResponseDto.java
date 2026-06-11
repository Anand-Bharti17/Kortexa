package com.kortexa.kortexa_backend.dto;

import com.kortexa.kortexa_backend.model.OrderRequestStatus;
import com.kortexa.kortexa_backend.model.OrderRequestType;
import com.kortexa.kortexa_backend.model.OrderStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class OrderRequestResponseDto {

    private Long id;
    private Long orderId;
    private OrderRequestType requestType;
    private OrderRequestStatus status;
    private String reason;
    private String resolutionNote;
    private String resolvedByEmail;
    private String customerEmail;
    private OrderStatus orderStatus;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
}
