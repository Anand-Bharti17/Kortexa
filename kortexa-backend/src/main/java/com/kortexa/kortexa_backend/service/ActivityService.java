package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.dto.ActivityEventResponse;
import com.kortexa.kortexa_backend.model.ActivityEvent;
import com.kortexa.kortexa_backend.model.ActivityType;
import com.kortexa.kortexa_backend.repository.ActivityEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityEventRepository activityEventRepository;

    public void log(ActivityType type, String actorEmail, String actorRole,
                    String message, String entityType, Long entityId) {
        ActivityEvent event = ActivityEvent.builder()
                .eventType(type)
                .actorEmail(actorEmail)
                .actorRole(actorRole)
                .message(message)
                .entityType(entityType)
                .entityId(entityId)
                .build();
        activityEventRepository.save(event);
        log.debug("Activity logged: type={}, actor={}", type, actorEmail);
    }

    public Page<ActivityEventResponse> getRecentActivity(int page, int size) {
        return activityEventRepository
                .findAllByOrderByCreatedAtDesc(PageRequest.of(page, size))
                .map(event -> ActivityEventResponse.builder()
                        .id(event.getId())
                        .eventType(event.getEventType())
                        .actorEmail(event.getActorEmail())
                        .actorRole(event.getActorRole())
                        .message(event.getMessage())
                        .entityType(event.getEntityType())
                        .entityId(event.getEntityId())
                        .createdAt(event.getCreatedAt())
                        .build());
    }
}
