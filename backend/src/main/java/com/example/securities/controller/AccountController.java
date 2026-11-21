package com.example.securities.controller;

import com.example.securities.dto.AccountCreateRequest;
import com.example.securities.dto.AccountDto;
import com.example.securities.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping
    public ResponseEntity<String> createAccount(@RequestBody AccountCreateRequest request, Principal principal) {
        Long newId = accountRepository.createAccount(principal.getName(), request.getName(),
                request.getAccountNumber(), request.getCurrencyId());

        return ResponseEntity.status(HttpStatus.CREATED).body("Счет успешно создан. ID: " + newId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteAccount(@PathVariable Long id, Principal principal) {
        // Проверяем, что счет принадлежит текущему пользователю
        if (!accountRepository.isAccountOwnedByUser(id, principal.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Доступ запрещен: вы не владелец этого счета");
        }

        try {
            accountRepository.deleteAccount(id);
            return ResponseEntity.ok("Счет успешно удален");
        } catch (DataIntegrityViolationException e) {
            // Перехватываем ошибку БД (RESTRICT), если на счете есть операции/активы
            return ResponseEntity.badRequest().body("Невозможно удалить счет: по нему уже есть активы или история операций.");
        }
    }
}