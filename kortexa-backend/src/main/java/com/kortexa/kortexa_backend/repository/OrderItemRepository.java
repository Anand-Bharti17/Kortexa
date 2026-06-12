package com.kortexa.kortexa_backend.repository;

import com.kortexa.kortexa_backend.model.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("SELECT oi FROM OrderItem oi "
            + "JOIN oi.product p "
            + "JOIN p.vendor v "
            + "WHERE LOWER(v.email) = LOWER(:email)")
    List<OrderItem> findByVendorEmailIgnoreCase(@Param("email") String email);

    @Query("""
            SELECT p.category,
                   SUM(oi.priceAtPurchase * oi.quantity),
                   SUM(oi.quantity)
            FROM OrderItem oi
            JOIN oi.product p
            JOIN oi.order o
            WHERE o.status IN (com.kortexa.kortexa_backend.model.OrderStatus.PAID,
                               com.kortexa.kortexa_backend.model.OrderStatus.SHIPPED,
                               com.kortexa.kortexa_backend.model.OrderStatus.DELIVERED)
            AND p.category IS NOT NULL AND p.category <> ''
            GROUP BY p.category
            ORDER BY SUM(oi.priceAtPurchase * oi.quantity) DESC
            """)
    List<Object[]> findTopCategoryRevenue(Pageable pageable);
}
