package com.example.securities.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AccountDto {
    private Long idAccount;
    private String accountNumber;
    private String name;
    private String currencyCode;
}
