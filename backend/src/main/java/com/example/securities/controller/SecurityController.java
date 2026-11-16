package com.example.securities.controller;

import com.example.securities.dto.SecurityDto;
import com.example.securities.repository.SecurityRepository;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/securities")
@AllArgsConstructor
public class SecurityController {
    private final SecurityRepository securityRepository;

    @GetMapping
    public List<SecurityDto> getAllSecurities() {
        return securityRepository.getAllSecurities();
    }
}
