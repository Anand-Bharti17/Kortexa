package com.kortexa.kortexa_backend.repository;

import com.kortexa.kortexa_backend.model.AccountStatus;
import com.kortexa.kortexa_backend.model.Role;
import com.kortexa.kortexa_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Spring Data JPA magically writes the SQL for this method based on its name!
    Optional<User> findByEmail(String email);

    // NEW: Find users by their role and status
    List<User> findByRoleAndStatus(Role role, AccountStatus status);
}