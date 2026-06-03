package com.kortexa.kortexa_backend.dto;

public record AiSearchResponse(
        String searchTerms,
        String category,
        String message
) {}
