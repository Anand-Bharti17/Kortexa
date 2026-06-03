package com.kortexa.kortexa_backend.dto;

import com.kortexa.kortexa_backend.model.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record OrderStatusUpdateRequest(
        @NotNull OrderStatus status
) {}
