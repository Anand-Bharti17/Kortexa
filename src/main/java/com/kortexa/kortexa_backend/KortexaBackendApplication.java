package com.kortexa.kortexa_backend;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

import java.util.TimeZone;

@Slf4j
@SpringBootApplication
@EnableCaching // <-- Required to activate the caching engine
public class KortexaBackendApplication {

	@PostConstruct
	public void init() {
		// Force the application to use UTC.
		// This solves the "Asia/Calcutta" Postgres error and is best practice for SaaS.
		TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
		log.info("Default timezone configured to UTC");
	}

	public static void main(String[] args) {
		SpringApplication.run(KortexaBackendApplication.class, args);
	}
}