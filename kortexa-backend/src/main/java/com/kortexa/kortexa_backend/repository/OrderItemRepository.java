package com.kortexa.kortexa_backend.repository;

import com.kortexa.kortexa_backend.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT oi FROM OrderItem oi " +
           "JOIN oi.product p " +
           "JOIN p.vendor v " +
           "WHERE LOWER(v.email) = LOWER(:email)")
    List<OrderItem> findByVendorEmailIgnoreCase(@org.springframework.data.repository.query.Param("email") String email);
}
