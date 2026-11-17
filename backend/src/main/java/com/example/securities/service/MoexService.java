package com.example.securities.service;

import com.example.securities.repository.SecurityRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MoexService {

    private final SecurityRepository securityRepository;
    private final RestClient restClient = RestClient.create();

    public int syncAllMarket() {
        int updatedCount = 0;
        try {
            // Запрос к MOEX: получаем весь список акций (TQBR - основной рынок)
            String url = "https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json";
            String jsonResponse = restClient.get().uri(url).retrieve().body(String.class);

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonResponse);

            // 1. Собираем цены из блока marketdata
            Map<String, BigDecimal> prices = new HashMap<>();
            JsonNode marketData = root.path("marketdata");
            JsonNode mdColumns = marketData.path("columns");
            int mdSecIdIndex = getColumnIndex(mdColumns, "SECID");
            int mdLastPriceIndex = getColumnIndex(mdColumns, "LAST");

            if (mdSecIdIndex != -1 && mdLastPriceIndex != -1) {
                for (JsonNode row : marketData.path("data")) {
                    if (!row.get(mdLastPriceIndex).isNull()) {
                        String secId = row.get(mdSecIdIndex).asText();
                        BigDecimal price = new BigDecimal(row.get(mdLastPriceIndex).asText());
                        prices.put(secId, price);
                    }
                }
            }

            // 2. Берем информацию о бумагах из блока securities и объединяем с ценами
            JsonNode secData = root.path("securities");
            JsonNode secColumns = secData.path("columns");
            int secSecIdIndex = getColumnIndex(secColumns, "SECID");
            int secShortNameIndex = getColumnIndex(secColumns, "SHORTNAME");
            int secIsinIndex = getColumnIndex(secColumns, "ISIN");

            if (secSecIdIndex != -1 && secShortNameIndex != -1) {
                for (JsonNode row : secData.path("data")) {
                    String ticker = row.get(secSecIdIndex).asText();
                    String shortName = row.get(secShortNameIndex).asText();
                    String isin = (secIsinIndex != -1 && !row.get(secIsinIndex).isNull()) ? row.get(secIsinIndex).asText() : null;

                    // Обновляем только те бумаги, по которым есть цена (кто-то торгуется)
                    if (prices.containsKey(ticker)) {
                        securityRepository.upsertSecurityFromMoex(ticker, shortName, isin, prices.get(ticker));
                        updatedCount++;
                    }
                }
            }
        } catch (Exception e) {
            System.out.println("Ошибка синхронизации с MOEX: " + e.getMessage());
        }
        return updatedCount;
    }

    // Вспомогательный метод: ищет индекс колонки по ее названию
    private int getColumnIndex(JsonNode columnsNode, String columnName) {
        for (int i = 0; i < columnsNode.size(); i++) {
            if (columnName.equals(columnsNode.get(i).asText())) {
                return i;
            }
        }
        return -1;
    }
}