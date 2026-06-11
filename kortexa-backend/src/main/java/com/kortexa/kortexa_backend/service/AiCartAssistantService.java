package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.dto.AiCartSuggestRequest;
import com.kortexa.kortexa_backend.dto.AiCartSuggestResponse;
import com.kortexa.kortexa_backend.model.Product;
import com.kortexa.kortexa_backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiCartAssistantService {

    private final ProductRepository productRepository;
    private final AiService aiService;

    public AiCartSuggestResponse suggest(AiCartSuggestRequest request) {
        BigDecimal budget = request.budget();
        List<Product> candidates = productRepository
                .searchAndFilterProducts(null, null, null, budget, null, PageRequest.of(0, 40))
                .getContent()
                .stream()
                .filter(p -> p.getStockQuantity() > 0)
                .toList();

        if (candidates.isEmpty()) {
            return new AiCartSuggestResponse(
                    "No in-stock products found under ₹" + budget.stripTrailingZeros().toPlainString() + ".",
                    budget,
                    List.of());
        }

        List<Long> pickedIds = aiService.suggestCartProductIds(budget, request.occasion(), candidates);
        Map<Long, Product> byId = candidates.stream()
                .collect(Collectors.toMap(Product::getId, Function.identity(), (a, b) -> a));

        List<Product> picked = new ArrayList<>();
        BigDecimal running = BigDecimal.ZERO;
        for (Long id : pickedIds) {
            Product p = byId.get(id);
            if (p != null && running.add(p.getPrice()).compareTo(budget) <= 0) {
                picked.add(p);
                running = running.add(p.getPrice());
            }
        }

        String message = aiService.extractCartSuggestMessage(budget, request.occasion(), picked);
        return new AiCartSuggestResponse(message, budget, picked);
    }
}
