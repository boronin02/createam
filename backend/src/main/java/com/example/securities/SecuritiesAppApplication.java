package com.example.securities;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SecuritiesAppApplication {

	public static void main(String[] args) {
		SpringApplication.run(SecuritiesAppApplication.class, args);
	}

}