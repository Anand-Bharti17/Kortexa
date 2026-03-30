package com.kortexa.kortexa_backend.config;

import com.kortexa.kortexa_backend.model.Product;
import com.kortexa.kortexa_backend.model.Role;
import com.kortexa.kortexa_backend.model.User;
import com.kortexa.kortexa_backend.model.AccountStatus;
import com.kortexa.kortexa_backend.repository.ProductRepository;
import com.kortexa.kortexa_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Slf4j
// @Component - DISABLED: DataSeeder is no longer needed
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Only run this if the store is mostly empty!
        if (productRepository.count() > 5) {
            log.info("Database already populated (>5 products). Skipping Data Seeder.");
            return;
        }

        log.info("Starting Data Seeder: generating 50 dummy products...");

        // 1. Make sure we have a Vendor to own these products
        User vendor = userRepository.findByEmail("megastore@kortexa.com").orElseGet(() -> {
            log.info("Seed vendor not found. Creating dummy vendor: megastore@kortexa.com");
            User newVendor = User.builder()
                    .email("megastore@kortexa.com")
                    .passwordHash(passwordEncoder.encode("password123"))
                    .role(Role.VENDOR)
                    .status(AccountStatus.ACTIVE) // Bypassing admin approval for the dummy vendor
                    .build();
            return userRepository.save(newVendor);
        });

        // 2. Arrays to generate random product names
        String[] adjectives = {"Ultra", "Smart", "Wireless", "Premium", "Ergonomic", "Portable", "Classic", "Pro"};
        String[] nouns = {"Headphones", "Keyboard", "Monitor", "Mouse", "Desk", "Chair", "Microphone", "Camera"};
        String[] categories = {"Electronics", "Office", "Audio", "Photography", "Gaming"};

        Random random = new Random();
        List<Product> dummyProducts = new ArrayList<>();

        // 3. Loop 50 times to create 50 products
        for (int i = 1; i <= 50; i++) {
            String adjective = adjectives[random.nextInt(adjectives.length)];
            String noun = nouns[random.nextInt(nouns.length)];
            String category = categories[random.nextInt(categories.length)];

            // Random price between $10.00 and $510.00
            double randomPrice = 10.0 + (500.0 * random.nextDouble());

            Product product = Product.builder()
                    .name(adjective + " " + noun + " " + i)
                    .description("This is a fantastic " + adjective.toLowerCase() + " " + noun.toLowerCase() + " perfect for your daily needs.")
                    .price(BigDecimal.valueOf(randomPrice))
                    .stockQuantity(random.nextInt(100) + 1) // Random stock between 1 and 100
                    .category(category)
                    .vendor(vendor)
                    .build();

            dummyProducts.add(product);
        }

        // 4. Save all 50 to the database at once!
        productRepository.saveAll(dummyProducts);
        log.info("Data Seeder completed: 50 products seeded successfully into the database.");
    }
}