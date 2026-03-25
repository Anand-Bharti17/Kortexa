package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.dto.RegisterRequest;
import com.kortexa.kortexa_backend.model.AccountStatus;
import com.kortexa.kortexa_backend.model.Role;
import com.kortexa.kortexa_backend.model.User;
import com.kortexa.kortexa_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.kortexa.kortexa_backend.dto.LoginRequest;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService; // Inject this
    private final AuthenticationManager authenticationManager; // Inject this
    private final UserDetailsService userDetailsService; // Inject this

    public Map<String, String> register(RegisterRequest request) {
        log.info("Registration attempt for email: {}, role: {}", request.email(), request.role());

        // NEW SECURITY PATCH: Block Privilege Escalation
        if (request.role() == Role.ADMIN) {
            log.warn("Security violation: Attempt to register ADMIN account via public API for email: {}", request.email());
            throw new SecurityException("Security Violation: Cannot register an account with ADMIN privileges via the public API.");
        }

        // 1. Check if email already exists
        if (userRepository.findByEmail(request.email()).isPresent()) {
            log.warn("Registration failed - email already registered: {}", request.email());
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
        log.info("User registered successfully: email={}, role={}, status={}", user.getEmail(), user.getRole(), user.getStatus());

        return Map.of("message", "User registered successfully", "email", user.getEmail());
    }

    public Map<String, String> login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.email());

        // 1. Authenticate the user (Spring Security will check the password hash)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()
                )
        );

        // 2. Fetch the user details to generate the token
        var user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // 3. Build a Spring Security UserDetails object
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .roles(user.getRole().name())
                .build();

        // 4. Generate the token
        String jwtToken = jwtService.generateToken(userDetails);
        log.info("Login successful for email: {}, role: {}", user.getEmail(), user.getRole());

        return Map.of(
                "token", jwtToken,
                "email", user.getEmail(),
                "role", user.getRole().name()
        );
    }
}