package com.kortexa.kortexa_backend.controller;

import com.kortexa.kortexa_backend.dto.AddressRequest;
import com.kortexa.kortexa_backend.model.Address;
import com.kortexa.kortexa_backend.service.AddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    public ResponseEntity<List<Address>> getAddresses(Principal principal) {
        return ResponseEntity.ok(addressService.getAddresses(principal.getName()));
    }

    @PostMapping
    public ResponseEntity<Address> createAddress(
            @Valid @RequestBody AddressRequest request,
            Principal principal) {
        return ResponseEntity.ok(addressService.createAddress(principal.getName(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Address> updateAddress(
            @PathVariable Long id,
            @Valid @RequestBody AddressRequest request,
            Principal principal) {
        return ResponseEntity.ok(addressService.updateAddress(principal.getName(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteAddress(
            @PathVariable Long id,
            Principal principal) {
        addressService.deleteAddress(principal.getName(), id);
        return ResponseEntity.ok(Map.of("message", "Address deleted"));
    }

    @PatchMapping("/{id}/default")
    public ResponseEntity<Address> setDefaultAddress(
            @PathVariable Long id,
            Principal principal) {
        return ResponseEntity.ok(addressService.setDefaultAddress(principal.getName(), id));
    }
}
