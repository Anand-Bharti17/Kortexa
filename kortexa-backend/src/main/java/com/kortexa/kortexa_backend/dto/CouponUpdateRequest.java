package com.kortexa.kortexa_backend.dto;

import lombok.Data;

@Data
public class CouponUpdateRequest {
    private String description;
    private Boolean active;
    private Integer maxUses;
}
