package com.kortexa.kortexa_backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderRequestResolveDto {

    @NotNull
    private Boolean approved;

    private String note;
}
