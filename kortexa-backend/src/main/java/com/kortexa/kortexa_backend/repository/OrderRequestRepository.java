package com.kortexa.kortexa_backend.repository;

import com.kortexa.kortexa_backend.model.OrderRequest;
import com.kortexa.kortexa_backend.model.OrderRequestStatus;
import com.kortexa.kortexa_backend.model.OrderRequestType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderRequestRepository extends JpaRepository<OrderRequest, Long> {

    boolean existsByOrderIdAndRequestTypeAndStatus(Long orderId, OrderRequestType type, OrderRequestStatus status);

    List<OrderRequest> findByCustomer_EmailOrderByCreatedAtDesc(String email);

    List<OrderRequest> findByOrderIdOrderByCreatedAtDesc(Long orderId);

    @EntityGraph(attributePaths = {"order", "order.customer", "order.items", "order.items.product", "order.items.product.vendor", "customer"})
    Page<OrderRequest> findByStatusOrderByCreatedAtDesc(OrderRequestStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"order", "order.customer", "order.items", "order.items.product", "order.items.product.vendor", "customer"})
    Page<OrderRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("""
            SELECT r FROM OrderRequest r
            JOIN r.order o
            JOIN o.items oi
            JOIN oi.product p
            JOIN p.vendor v
            WHERE r.status = :status
            AND LOWER(v.email) = LOWER(:vendorEmail)
            ORDER BY r.createdAt DESC
            """)
    List<OrderRequest> findPendingForVendor(@Param("vendorEmail") String vendorEmail,
                                           @Param("status") OrderRequestStatus status);

    @EntityGraph(attributePaths = {"order", "order.customer", "order.items", "order.items.product", "customer"})
    Optional<OrderRequest> findWithDetailsById(Long id);
}
