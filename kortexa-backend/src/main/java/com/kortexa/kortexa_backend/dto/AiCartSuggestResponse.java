package com.kortexa.kortexa_backend.dto;

import com.kortexa.kortexa_backend.model.Product;

import java.math.BigDecimal;
import java.util.List;

public record AiCartSuggestResponse(
        String message,
        BigDecimal budget,
        List<Product> products
) {}
