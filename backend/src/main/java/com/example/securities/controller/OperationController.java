package com.example.securities.controller;

import com.example.securities.dto.OperationRequestDto;
import com.example.securities.repository.OperationRepository;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/operations")
@AllArgsConstructor
public class OperationController {
    private final OperationRepository operationRepository;

    @PostMapping
    public ResponseEntity<String> createOperation(@RequestBody OperationRequestDto request) {
        try {
            operationRepository.createOperation(request);
            return ResponseEntity.status(HttpStatus.CREATED).body("Операция успешно добавлена, портфель обновлен триггером!");
        } catch (Exception e) {
            // Если триггер БД выбросит ошибку (например, при продаже больше, чем есть),
            return ResponseEntity.badRequest().body("Ошибка при создании операции: " + e.getMessage());
        }
    }
}
