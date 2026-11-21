package com.example.securities.controller;

import com.example.securities.repository.ReportRepository;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@AllArgsConstructor
public class ReportController {
    private final ReportRepository reportRepository;

    @GetMapping("/operations")
    public List<Map<String, Object>> getOperationHistory(Principal principal) {
        return reportRepository.getOperationHistory(principal.getName());
    }

    @GetMapping("/incomes")
    public List<Map<String, Object>> getIncomeSummary(Principal principal) {
        return reportRepository.getIncomeSummary(principal.getName());
    }

    @GetMapping("/freshness")
    public List<Map<String, Object>> getMarketDataFreshness() {
        return reportRepository.getMarketDataFreshness();
    }

    @GetMapping("/commissions")
    public List<Map<String, Object>> getCommissionsByDay(Principal principal) {
        return reportRepository.getCommissionsByDay(principal.getName());
    }
}
