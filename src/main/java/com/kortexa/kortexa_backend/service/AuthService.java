package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.dto.RegisterRequest;
import com.kortexa.kortexa_backend.model.AccountStatus;
import com.kortexa.kortexa_backend.model.Role;
import com.kortexa.kortexa_backend.model.User;
import com.kortexa.kortexa_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Map<String, String> register(RegisterRequest request) {
        // 1. Check if email already exists
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new IllegalArgumentException("Email is already registered");
        }

        // 2. Determine Account Status (Vendors need approval, Customers are active immediately)
        AccountStatus status = request.role() == Role.VENDOR ?
                AccountStatus.PENDING_APPROVAL : AccountStatus.ACTIVE;

        // 3. Create and save the user
        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(request.role())
                .status(status)
                .build();

        userRepository.save(user);

        return Map.of("message", "User registered successfully", "email", user.getEmail());
    }
}