package com.kortexa.kortexa_backend.dto;

import com.kortexa.kortexa_backend.model.AccountStatus;
import com.kortexa.kortexa_backend.model.Role;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String email,
        String name,
        String profileImageUrl,
        Role role,
        AccountStatus status,
        LocalDateTime createdAt
) {}