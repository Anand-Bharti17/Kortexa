package com.kortexa.kortexa_backend.repository;

import com.kortexa.kortexa_backend.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUser_EmailOrderByCreatedAtDesc(String email, Pageable pageable);

    long countByUser_EmailAndReadFalse(String email);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.user.email = :email AND n.read = false")
    int markAllReadForUser(@Param("email") String email);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.id = :id AND n.user.email = :email")
    int markReadByIdAndUser(@Param("id") Long id, @Param("email") String email);
}
