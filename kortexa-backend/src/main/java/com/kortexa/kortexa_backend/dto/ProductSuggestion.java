package com.kortexa.kortexa_backend.dto;

import java.math.BigDecimal;

public record ProductSuggestion(
        Long id,
        String name,
        String category,
        BigDecimal price,
        String imageUrl
) {}
