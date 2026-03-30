package com.kortexa.kortexa_backend.repository;

import com.kortexa.kortexa_backend.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    // Finds all sold items where the product belongs to a specific vendor
    List<OrderItem> findByProduct_Vendor_Email(String vendorEmail);
}
