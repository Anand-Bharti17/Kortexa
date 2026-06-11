package com.kortexa.kortexa_backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record AiCartSuggestRequest(
        @NotNull @DecimalMin("1") BigDecimal budget,
        @Size(max = 300) String occasion
) {}
