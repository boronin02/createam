package com.example.securities.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SecurityDto {
    Long idSecurity;
    String ticker;
    String isin;
    String name;
    BigDecimal currentPrice;
    String typeName;
    String issuerName;
    String currencyCode;
}
