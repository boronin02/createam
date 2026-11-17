package com.example.securities.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class OperationRequestDto {
    private Long idAccount;
    private Long idSecurity;
    private Integer idOperationType; // 1 - Покупка, 2 - Продажа
    private Long quantity;
    private BigDecimal price;
    private BigDecimal commission;
}
