package com.kortexa.kortexa_backend.repository;

import com.kortexa.kortexa_backend.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByCustomer_IdOrderByOrderDateDesc(Long customerId);

    @EntityGraph(attributePaths = {
            "customer",
            "shippingAddress",
            "items",
            "items.product",
            "items.product.vendor"
    })
    Page<Order> findAllByOrderByOrderDateDesc(Pageable pageable);
}