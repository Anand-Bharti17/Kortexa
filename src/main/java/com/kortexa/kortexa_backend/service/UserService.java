package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.dto.UserResponse;
import com.kortexa.kortexa_backend.model.User;
import com.kortexa.kortexa_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserResponse getUserProfile(String email) {
        log.debug("Fetching user profile for: {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("User profile fetch failed - user not found: {}", email);
                    return new IllegalArgumentException("User not found");
                });

        // Map the database entity to our safe DTO
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt()
        );
    }
}