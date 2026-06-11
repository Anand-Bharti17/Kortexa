package com.kortexa.kortexa_backend.repository;

import com.kortexa.kortexa_backend.model.ActivityEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityEventRepository extends JpaRepository<ActivityEvent, Long> {

    Page<ActivityEvent> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
