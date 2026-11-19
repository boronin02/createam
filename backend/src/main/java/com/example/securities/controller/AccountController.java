package com.example.securities.controller;

import com.example.securities.dto.AccountDto;
import com.example.securities.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {
    private final AccountRepository accountRepository;

    @GetMapping
    public List<AccountDto> getMyAccounts(Principal principal) {
        return accountRepository.findAccountsByUsername(principal.getName());
    }
}
