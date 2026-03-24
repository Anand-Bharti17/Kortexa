package com.kortexa.kortexa_backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/health").permitAll()
                        // 1. SPECIFIC RULE: Allow everyone to browse the store (Must go FIRST)
                        .requestMatchers("/api/products/store").permitAll()

                        // 2. GENERAL RULE: Require Vendor for all other product endpoints (create, edit, AI)
                        .requestMatchers("/api/products/**").hasAuthority("VENDOR")

                        // 3. Admin rules, etc...
                        .requestMatchers("/api/admin/**").hasAuthority("ADMIN")

                        // 4. Catch-all: Everything else requires you to be logged in
                        .anyRequest().authenticated()
                )
                // NEW: Tell Spring NOT to create a session (we are using JWTs)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authenticationProvider(authenticationProvider)
                // NEW: Add our JWT filter before the standard login filter
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}