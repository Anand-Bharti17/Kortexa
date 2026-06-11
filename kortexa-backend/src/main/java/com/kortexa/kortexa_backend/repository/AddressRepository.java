package com.kortexa.kortexa_backend.repository;

import com.kortexa.kortexa_backend.model.Address;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AddressRepository extends JpaRepository<Address, Long> {

    List<Address> findByUser_EmailOrderByIsDefaultDescCreatedAtDesc(String email);

    Optional<Address> findByIdAndUser_Email(Long id, String email);
}
