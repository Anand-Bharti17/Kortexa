package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.dto.NotificationResponseDto;
import com.kortexa.kortexa_backend.model.Notification;
import com.kortexa.kortexa_backend.model.User;
import com.kortexa.kortexa_backend.repository.NotificationRepository;
import com.kortexa.kortexa_backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void notifyUser(String userEmail, String title, String message,
                           String type, String entityType, Long entityId) {
        if (userEmail == null || userEmail.isBlank()) {
            return;
        }
        userRepository.findByEmail(userEmail).ifPresent(user -> notificationRepository.save(
                Notification.builder()
                        .user(user)
                        .title(title)
                        .message(message)
                        .notificationType(type)
                        .entityType(entityType)
                        .entityId(entityId)
                        .build()));
    }

    public Page<NotificationResponseDto> getNotifications(String email, int page, int size) {
        int safeSize = Math.min(Math.max(size, 1), 50);
        return notificationRepository
                .findByUser_EmailOrderByCreatedAtDesc(email, PageRequest.of(page, safeSize))
                .map(this::toDto);
    }

    public long getUnreadCount(String email) {
        return notificationRepository.countByUser_EmailAndReadFalse(email);
    }

    @Transactional
    public void markAllRead(String email) {
        notificationRepository.markAllReadForUser(email);
    }

    @Transactional
    public void markRead(String email, Long notificationId) {
        notificationRepository.markReadByIdAndUser(notificationId, email);
    }

    private NotificationResponseDto toDto(Notification n) {
        return NotificationResponseDto.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .notificationType(n.getNotificationType())
                .entityType(n.getEntityType())
                .entityId(n.getEntityId())
                .read(Boolean.TRUE.equals(n.getRead()))
                .createdAt(n.getCreatedAt())
                .build();
    }
}
