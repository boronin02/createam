package com.example.securities.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AccountCreateRequest {
    private String accountNumber;
    private String name;         // Название (например, "Мой ИИС")
    private Integer currencyId;  // 1 - RUB, 2 - USD и т.д.
}
