package com.example.securities.service;

import com.example.securities.dto.CandleDto;
import com.example.securities.repository.SecurityRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MoexService {

    private final SecurityRepository securityRepository;
    private final RestClient restClient = RestClient.create();

    public int syncAllMarket() {
        int updatedCount = 0;
        try {
            // Запрос к MOEX: получаем весь список акций
            String url = "https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json";
            String jsonResponse = restClient.get().uri(url).retrieve().body(String.class);

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonResponse);

            // Собираем цены из блока marketdata
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

            // Берем информацию о бумагах из блока securities и объединяем с ценами
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

    public List<CandleDto> getHistory(String ticker, String from, String till, String interval) {
        List<CandleDto> candles = new java.util.ArrayList<>();

        try {
            String fromDate = (from != null && !from.isEmpty()) ? from : java.time.LocalDate.now().minusDays(30).toString();
            String tillDate = (till != null && !till.isEmpty()) ? till : java.time.LocalDate.now().toString();
            String intervalParam = (interval != null && !interval.isEmpty()) ? interval : "24";

            String url = String.format(
                    "https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities/%s/candles.json?from=%s&till=%s&interval=%s",
                    ticker, fromDate, tillDate, intervalParam
            );

            String jsonResponse = restClient.get().uri(url).retrieve().body(String.class);

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonResponse);

            JsonNode candlesNode = root.path("candles");
            JsonNode columns = candlesNode.path("columns");

            int openIdx = getColumnIndex(columns, "open");
            int closeIdx = getColumnIndex(columns, "close");
            int highIdx = getColumnIndex(columns, "high");
            int lowIdx = getColumnIndex(columns, "low");
            int volumeIdx = getColumnIndex(columns, "volume");
            int beginIdx = getColumnIndex(columns, "begin");

            // Если данных нет или колонки не найдены, возвращаем пустой список
            if (openIdx == -1 || beginIdx == -1 || !candlesNode.path("data").isArray()) {
                return candles;
            }

            for (JsonNode row : candlesNode.path("data")) {
                if (!row.get(openIdx).isNull()) {
                    // Берем дату и время. Если интервал 24 (день), оставляем только "YYYY-MM-DD"
                    String beginStr = row.get(beginIdx).asText();
                    if ("24".equals(intervalParam)) {
                        beginStr = beginStr.substring(0, 10);
                    }

                    candles.add(new CandleDto(
                            beginStr,
                            new BigDecimal(row.get(openIdx).asText()),
                            new BigDecimal(row.get(highIdx).asText()),
                            new BigDecimal(row.get(lowIdx).asText()),
                            new BigDecimal(row.get(closeIdx).asText()),
                            new BigDecimal(row.get(volumeIdx).asText())
                    ));
                }
            }
        } catch (Exception e) {
            System.out.println("Ошибка получения истории для " + ticker + ": " + e.getMessage());
        }

        return candles;
    }

    @Scheduled(fixedRate = 600000, initialDelay = 15000)
    public void scheduledSync() {
        System.out.println("[АВТООБНОВЛЕНИЕ] Запуск фоновой синхронизации с Московской биржей...");

        // Вызываем наш основной метод синхронизации
        int count = syncAllMarket();

        System.out.println("[АВТООБНОВЛЕНИЕ] Синхронизация завершена. Всего бумаг в базе: " + count);
    }
}