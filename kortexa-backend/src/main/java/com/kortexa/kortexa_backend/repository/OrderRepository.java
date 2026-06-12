package com.kortexa.kortexa_backend.repository;

import com.kortexa.kortexa_backend.model.Order;
import com.kortexa.kortexa_backend.model.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
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

    @Query("""
            SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o
            WHERE o.status IN :statuses
            """)
    BigDecimal sumTotalAmountByStatusIn(@Param("statuses") List<OrderStatus> statuses);

    @Query("""
            SELECT COUNT(o) FROM Order o
            WHERE o.status IN :statuses
            """)
    long countByStatusIn(@Param("statuses") List<OrderStatus> statuses);

    @Query(value = """
            SELECT COALESCE(SUM(total_amount), 0) FROM orders
            WHERE status IN ('PAID', 'SHIPPED', 'DELIVERED')
            AND CAST(order_date AS DATE) = CURRENT_DATE
            """, nativeQuery = true)
    BigDecimal sumRevenueToday();

    @Query(value = """
            SELECT COUNT(*) FROM orders
            WHERE status IN ('PAID', 'SHIPPED', 'DELIVERED')
            AND CAST(order_date AS DATE) = CURRENT_DATE
            """, nativeQuery = true)
    long countOrdersToday();

    @Query(value = """
            SELECT CAST(order_date AS DATE) AS day,
                   COUNT(*) AS order_count,
                   COALESCE(SUM(total_amount), 0) AS revenue
            FROM orders
            WHERE status IN ('PAID', 'SHIPPED', 'DELIVERED')
            AND order_date >= CURRENT_DATE - INTERVAL '6 days'
            GROUP BY CAST(order_date AS DATE)
            ORDER BY day ASC
            """, nativeQuery = true)
    List<Object[]> dailyOrderStatsLastSevenDays();
}