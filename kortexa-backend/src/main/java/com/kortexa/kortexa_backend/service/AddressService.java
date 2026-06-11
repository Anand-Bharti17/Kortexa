package com.kortexa.kortexa_backend.service;

import com.kortexa.kortexa_backend.dto.AddressRequest;
import com.kortexa.kortexa_backend.model.Address;
import com.kortexa.kortexa_backend.model.ActivityType;
import com.kortexa.kortexa_backend.model.User;
import com.kortexa.kortexa_backend.repository.AddressRepository;
import com.kortexa.kortexa_backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final ActivityService activityService;

    public List<Address> getAddresses(String email) {
        return addressRepository.findByUser_EmailOrderByIsDefaultDescCreatedAtDesc(email);
    }

    @Transactional
    public Address createAddress(String email, AddressRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.isDefault()) {
            clearDefaultForUser(user.getId());
        }

        Address address = Address.builder()
                .user(user)
                .label(request.getLabel())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .line1(request.getLine1())
                .line2(request.getLine2())
                .city(request.getCity())
                .state(request.getState())
                .postalCode(request.getPostalCode())
                .country(request.getCountry() != null ? request.getCountry() : "India")
                .isDefault(request.isDefault())
                .build();

        Address saved = addressRepository.save(address);

        if (!saved.isDefault() && addressRepository.findByUser_EmailOrderByIsDefaultDescCreatedAtDesc(email).size() == 1) {
            saved.setDefault(true);
            saved = addressRepository.save(saved);
        }

        activityService.log(ActivityType.ADDRESS_SAVED, email, user.getRole().name(),
                "Saved shipping address in " + saved.getCity(), "ADDRESS", saved.getId());

        return saved;
    }

    @Transactional
    public Address updateAddress(String email, Long addressId, AddressRequest request) {
        Address address = addressRepository.findByIdAndUser_Email(addressId, email)
                .orElseThrow(() -> new IllegalArgumentException("Address not found"));

        if (request.isDefault()) {
            clearDefaultForUser(address.getUser().getId());
        }

        address.setLabel(request.getLabel());
        address.setFullName(request.getFullName());
        address.setPhone(request.getPhone());
        address.setLine1(request.getLine1());
        address.setLine2(request.getLine2());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPostalCode(request.getPostalCode());
        if (request.getCountry() != null) {
            address.setCountry(request.getCountry());
        }
        address.setDefault(request.isDefault());

        return addressRepository.save(address);
    }

    @Transactional
    public void deleteAddress(String email, Long addressId) {
        Address address = addressRepository.findByIdAndUser_Email(addressId, email)
                .orElseThrow(() -> new IllegalArgumentException("Address not found"));
        addressRepository.delete(address);
    }

    @Transactional
    public Address setDefaultAddress(String email, Long addressId) {
        Address address = addressRepository.findByIdAndUser_Email(addressId, email)
                .orElseThrow(() -> new IllegalArgumentException("Address not found"));
        clearDefaultForUser(address.getUser().getId());
        address.setDefault(true);
        return addressRepository.save(address);
    }

    private void clearDefaultForUser(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return;
        }
        for (Address existing : addressRepository.findByUser_EmailOrderByIsDefaultDescCreatedAtDesc(user.getEmail())) {
            if (existing.isDefault()) {
                existing.setDefault(false);
                addressRepository.save(existing);
            }
        }
    }
}
