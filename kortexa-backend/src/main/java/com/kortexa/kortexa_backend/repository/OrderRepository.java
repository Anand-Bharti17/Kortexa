package com.kortexa.kortexa_backend.repository;

import com.kortexa.kortexa_backend.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Query("""
            SELECT oi.product.id FROM OrderItem oi
            JOIN oi.order o
            WHERE LOWER(o.customer.email) = LOWER(:email)
            AND o.status IN (com.kortexa.kortexa_backend.model.OrderStatus.PAID,
                             com.kortexa.kortexa_backend.model.OrderStatus.SHIPPED,
                             com.kortexa.kortexa_backend.model.OrderStatus.DELIVERED)
            GROUP BY oi.product.id
            ORDER BY MAX(o.orderDate) DESC
            """)
    List<Long> findRecentPurchasedProductIds(@Param("email") String email, Pageable pageable);
}