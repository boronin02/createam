package com.example.securities.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SecurityDto {
    private Long idSecurity;
    private String ticker;
    private String isin;
    private String name;
    private BigDecimal currentPrice;
    private BigDecimal dailyChangeRub;
    private BigDecimal dailyChangePercent;
    private String typeName;
    private String issuerName;
    private String currencyCode;
}
