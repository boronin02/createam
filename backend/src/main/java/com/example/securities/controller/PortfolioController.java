package com.example.securities.controller;

import com.example.securities.dto.PortfolioItemDto;
import com.example.securities.dto.PortfolioSummaryDto;
import com.example.securities.repository.AccountRepository;
import com.example.securities.repository.PortfolioRepository;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/portfolio")
@AllArgsConstructor
public class PortfolioController {
    private final PortfolioRepository portfolioRepository;
    private final AccountRepository accountRepository;

    @GetMapping("/{accountId}")
    public ResponseEntity<?> getPortfolio(@PathVariable Long accountId, Principal principal) {
        // принадлежит ли счет этому пользователю?
        if (!accountRepository.isAccountOwnedByUser(accountId, principal.getName())) {
            return ResponseEntity.status(403).body("Доступ запрещен: вы не владелец этого счета");
        }

        List<PortfolioItemDto> portfolio = portfolioRepository.getPortfolioByAccount(accountId);
        return ResponseEntity.ok(portfolio);
    }

    @GetMapping("/{accountId}/summary")
    public ResponseEntity<?> getPortfolioSummary(@PathVariable Long accountId, Principal principal) {
        // принадлежит ли счет этому пользователю?
        if (!accountRepository.isAccountOwnedByUser(accountId, principal.getName())) {
            return ResponseEntity.status(403).body("Доступ запрещен: вы не владелец этого счета");
        }

        PortfolioSummaryDto summary = portfolioRepository.getPortfolioSummary(accountId);
        return ResponseEntity.ok(summary);
    }
}
