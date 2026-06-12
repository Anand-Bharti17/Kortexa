package com.kortexa.kortexa_backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponseDto {
    private Long id;
    private String title;
    private String message;
    private String notificationType;
    private String entityType;
    private Long entityId;
    private boolean read;
    private LocalDateTime createdAt;
}
