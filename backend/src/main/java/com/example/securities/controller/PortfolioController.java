package com.example.securities.controller;

import com.example.securities.dto.PortfolioItemDto;
import com.example.securities.repository.PortfolioRepository;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/portfolio")
@AllArgsConstructor
public class PortfolioController {
    private final PortfolioRepository portfolioRepository;

    @GetMapping("/{accountId}")
    public List<PortfolioItemDto> getPortfolio(@PathVariable Long accountId) {
        return portfolioRepository.getPortfolioByAccount(accountId);
    }
}
