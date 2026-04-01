package com.kortexa.kortexa_backend.controller;

import com.kortexa.kortexa_backend.dto.UserResponse;
import com.kortexa.kortexa_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // GET /api/users/me -> Returns the profile of the currently logged-in user
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        log.debug("Get current user profile request: user={}", authentication.getName());
        // authentication.getName() contains the email extracted from the JWT
        return ResponseEntity.ok(userService.getUserProfile(authentication.getName()));
    }
}