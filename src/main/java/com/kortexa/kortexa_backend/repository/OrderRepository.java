package com.kortexa.kortexa_backend.repository;

import com.kortexa.kortexa_backend.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    // Finds all orders for a specific customer, showing the newest ones first
    List<Order> findByCustomer_IdOrderByOrderDateDesc(Long customerId);
}