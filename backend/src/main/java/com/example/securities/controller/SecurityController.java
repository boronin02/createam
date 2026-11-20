package com.example.securities.controller;

import com.example.securities.dto.CandleDto;
import com.example.securities.dto.SecurityDto;
import com.example.securities.repository.SecurityRepository;
import com.example.securities.service.MoexService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/securities")
@AllArgsConstructor
public class SecurityController {
    private final SecurityRepository securityRepository;
    private final MoexService moexService;

    @GetMapping
    public List<SecurityDto> getAllSecurities() {
        return securityRepository.getAllSecurities();
    }

    @PostMapping("/sync")
    public String syncPrices() {
        int count = moexService.syncAllMarket();
        return "Успешно! Обновлено или добавлено бумаг: " + count;
    }

    @GetMapping("/{ticker}/history")
    public List<CandleDto> getHistory(
            @PathVariable String ticker,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String till,
            @RequestParam(required = false) String interval) {
        return moexService.getHistory(ticker, from, till, interval);
    }

    @GetMapping("/{ticker}")
    public ResponseEntity<SecurityDto> getSecurityByTicker(@PathVariable String ticker) {
        SecurityDto dto = securityRepository.getSecurityByTicker(ticker.toUpperCase());
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/sync/market")
    public String syncStocksAndEtfs() {
        return "Обновлено акций и ETF: " + moexService.syncStocksAndEtfs();
    }

    @PostMapping("/sync/bonds")
    public String syncBonds() {
        return "Обновлено облигаций: " + moexService.syncBonds();
    }
}
