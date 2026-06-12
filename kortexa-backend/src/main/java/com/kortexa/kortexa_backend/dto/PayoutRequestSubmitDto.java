package com.kortexa.kortexa_backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PayoutRequestSubmitDto {

    @NotNull
    @DecimalMin("1")
    private BigDecimal amount;

    @Size(max = 500)
    private String paymentNote;
}
