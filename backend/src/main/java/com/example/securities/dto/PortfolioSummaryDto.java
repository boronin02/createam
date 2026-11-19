package com.example.securities.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class PortfolioSummaryDto {
    private Long totalAssets;
    private BigDecimal totalValue;
    private BigDecimal totalPnl;
}
