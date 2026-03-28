package com.kortexa.kortexa_backend.controller;

import com.kortexa.kortexa_backend.dto.RegisterRequest;
import com.kortexa.kortexa_backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.kortexa.kortexa_backend.dto.LoginRequest;


import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
        try {
            Map<String, String> response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Registration rejected: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }


    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            // Call the service which might throw the PENDING_APPROVAL exception
            return ResponseEntity.ok(authService.login(request));

        } catch (RuntimeException e) {
            log.warn("Login failed for email={}: {}", request.email(), e.getMessage());

            // THE FIX: Check if the exception is our specific Pending Approval block
            if (e.getMessage() != null && e.getMessage().contains("PENDING_APPROVAL")) {
                // Send a 403 Forbidden with the exact 'message' key React is waiting for
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", e.getMessage()));
            }

            // If it's a normal bad password, send the generic 401 Unauthorized
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password"));
        }
    }
}