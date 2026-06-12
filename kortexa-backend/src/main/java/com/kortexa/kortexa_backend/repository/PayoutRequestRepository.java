package com.kortexa.kortexa_backend.repository;

import com.kortexa.kortexa_backend.model.PayoutRequest;
import com.kortexa.kortexa_backend.model.PayoutRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PayoutRequestRepository extends JpaRepository<PayoutRequest, Long> {

    List<PayoutRequest> findByVendor_EmailOrderByCreatedAtDesc(String vendorEmail);

    boolean existsByVendor_EmailAndStatus(String vendorEmail, PayoutRequestStatus status);

    @EntityGraph(attributePaths = "vendor")
    Page<PayoutRequest> findByStatusOrderByCreatedAtDesc(PayoutRequestStatus status, Pageable pageable);

    @EntityGraph(attributePaths = "vendor")
    Page<PayoutRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = "vendor")
    Optional<PayoutRequest> findWithVendorById(Long id);
}
