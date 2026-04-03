package com.kortexa.kortexa_backend.controller;

import com.kortexa.kortexa_backend.dto.UserResponse;
import com.kortexa.kortexa_backend.service.ImageUploadService;
import com.kortexa.kortexa_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final ImageUploadService imageUploadService;

    // GET /api/users/me -> Returns the profile of the currently logged-in user
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        log.debug("Get current user profile request: user={}", authentication.getName());
        // authentication.getName() contains the email extracted from the JWT
        return ResponseEntity.ok(userService.getUserProfile(authentication.getName()));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            Authentication authentication,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) MultipartFile profileImage) throws IOException {
        
        log.debug("Update profile request: user={}", authentication.getName());
        
        String profileImageUrl = null;
        if (profileImage != null && !profileImage.isEmpty()) {
            profileImageUrl = imageUploadService.uploadImage(profileImage);
        }
        
        return ResponseEntity.ok(userService.updateUserProfile(authentication.getName(), name, profileImageUrl));
    }
}