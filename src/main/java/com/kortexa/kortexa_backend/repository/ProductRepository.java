package com.kortexa.kortexa_backend.repository;

import com.kortexa.kortexa_backend.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // Spring Data JPA automatically writes the SQL for these based on the method names!
    List<Product> findByVendorId(Long vendorId);

    List<Product> findByCategory(String category);
}