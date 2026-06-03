package com.kortexa.kortexa_backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.beans.factory.annotation.Value;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthRateLimitFilter authRateLimitFilter;
    private final AuthenticationProvider authenticationProvider;

    @Value("${app.security.cors-allowed-origins:http://localhost:5173}")
    private String corsAllowedOrigins;

    @Value("${app.security.expose-openapi:false}")
    private boolean exposeOpenApi;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. ACTIVATE CORS (This is what fixes your error!)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 2. DISABLE CSRF (Required for JWT REST APIs)
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers
                        .frameOptions(frame -> frame.deny())
                        .contentTypeOptions(contentType -> {})
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31_536_000))
                )
                .authorizeHttpRequests(auth -> {
                    auth.requestMatchers("/api/auth/**").permitAll()
                            .requestMatchers("/api/health").permitAll()
                            .requestMatchers("/api/products/store", "/api/products/store/**").permitAll()
                            .requestMatchers(HttpMethod.GET, "/api/products", "/api/products/**").permitAll()
                            .requestMatchers(HttpMethod.GET, "/api/reviews/product/**").permitAll()
                            .requestMatchers("/api/payments/charge").denyAll();

                    if (exposeOpenApi) {
                        auth.requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll();
                    } else {
                        auth.requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").hasRole("ADMIN");
                    }

                    auth.requestMatchers(HttpMethod.POST, "/api/reviews/product/**").hasRole("CUSTOMER")
                            .requestMatchers("/api/cart/**").hasRole("CUSTOMER")
                            .requestMatchers("/api/wishlist/**").hasRole("CUSTOMER")
                            .requestMatchers("/api/orders/vendor/**").hasRole("VENDOR")
                            .requestMatchers("/api/orders/**").hasRole("CUSTOMER")
                            .requestMatchers("/api/payments/**").hasRole("CUSTOMER")
                            .requestMatchers("/api/products/**").hasRole("VENDOR")
                            .requestMatchers("/api/admin/**").hasRole("ADMIN")
                            .anyRequest().authenticated();
                })
                // NEW: Tell Spring NOT to create a session (we are using JWTs)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(authRateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ADD THIS NEW BEAN TO ALLOW VITE TO TALK TO SPRING BOOT
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Allow your Vite frontend URL
        List<String> origins = Arrays.stream(corsAllowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();
        configuration.setAllowedOrigins(origins);
        // Allow these HTTP methods
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        // Allow all headers (including Authorization for JWT)
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Apply this rule to all API endpoints
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}