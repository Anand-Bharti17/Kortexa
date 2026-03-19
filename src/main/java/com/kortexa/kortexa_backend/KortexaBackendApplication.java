package com.kortexa.kortexa_backend;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class KortexaBackendApplication {

	@PostConstruct
	public void init() {
		// Force the application to use UTC.
		// This solves the "Asia/Calcutta" Postgres error and is best practice for SaaS.
		TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
	}

	public static void main(String[] args) {
		SpringApplication.run(KortexaBackendApplication.class, args);
	}
}