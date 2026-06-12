package com.kortexa.kortexa_backend.repository;

import com.kortexa.kortexa_backend.model.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    List<ProductVariant> findByProductIdOrderByIdAsc(Long productId);
    Optional<ProductVariant> findByIdAndProductId(Long id, Long productId);
}
