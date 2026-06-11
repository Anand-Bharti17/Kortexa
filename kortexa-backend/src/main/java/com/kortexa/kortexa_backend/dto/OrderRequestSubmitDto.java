package com.kortexa.kortexa_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OrderRequestSubmitDto {

    @NotBlank
    private String reason;
}
