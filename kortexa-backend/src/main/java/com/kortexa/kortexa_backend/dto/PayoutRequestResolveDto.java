package com.kortexa.kortexa_backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PayoutRequestResolveDto {

    @NotNull
    private Boolean approved;

    private String note;
}
