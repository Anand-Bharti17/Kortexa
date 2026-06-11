package com.kortexa.kortexa_backend.dto;

import com.kortexa.kortexa_backend.model.ActivityType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ActivityEventResponse {

    private Long id;
    private ActivityType eventType;
    private String actorEmail;
    private String actorRole;
    private String message;
    private String entityType;
    private Long entityId;
    private LocalDateTime createdAt;
}
