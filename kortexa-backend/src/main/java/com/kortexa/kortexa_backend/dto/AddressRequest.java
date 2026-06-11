package com.kortexa.kortexa_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddressRequest {

    private String label;

    @NotBlank
    private String fullName;

    private String phone;

    @NotBlank
    private String line1;

    private String line2;

    @NotBlank
    private String city;

    private String state;

    @NotBlank
    private String postalCode;

    private String country;

    private boolean isDefault;
}
