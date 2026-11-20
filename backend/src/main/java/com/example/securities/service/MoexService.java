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
import java.net.URI;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MoexService {

    private final SecurityRepository securityRepository;
    private final RestClient restClient = RestClient.create();

    // СИНХРОНИЗАЦИЯ ТЕКУЩИХ КОТИРОВОК
    public int syncStocksAndEtfs() { return syncMarket("shares", "TQBR", 1); }
    public int syncBonds() { return syncMarket("bonds", "TQCB", 2); }

    public int syncAllMarket() {
        int total = 0;
        total += syncStocksAndEtfs();
        total += syncBonds();
        return total;
    }

    private int syncMarket(String market, String board, int defaultTypeId) {
        int updatedCount = 0;
        try {
            String url = String.format("https://iss.moex.com/iss/engines/stock/markets/%s/boards/%s/securities.json", market, board);
            String jsonResponse = restClient.get().uri(URI.create(url)).retrieve().body(String.class);
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonResponse);

            Map<String, BigDecimal> lastPrices = new HashMap<>();

            JsonNode marketData = root.path("marketdata");
            JsonNode mdColumns = marketData.path("columns");
            int mdSecIdIdx = getColumnIndex(mdColumns, "SECID");
            int mdLastIdx = getColumnIndex(mdColumns, "LAST");

            if (mdSecIdIdx != -1 && mdLastIdx != -1) {
                for (JsonNode row : marketData.path("data")) {
                    if (!row.get(mdLastIdx).isNull()) {
                        lastPrices.put(row.get(mdSecIdIdx).asText(), new BigDecimal(row.get(mdLastIdx).asText()));
                    }
                }
            }

            JsonNode secData = root.path("securities");
            JsonNode secColumns = secData.path("columns");
            int secSecIdIdx = getColumnIndex(secColumns, "SECID");
            int secShortNameIdx = getColumnIndex(secColumns, "SHORTNAME");
            int secIsinIdx = getColumnIndex(secColumns, "ISIN");
            int secPrevPriceIdx = getColumnIndex(secColumns, "PREVPRICE");

            if (secSecIdIdx != -1 && secShortNameIdx != -1) {
                for (JsonNode row : secData.path("data")) {
                    String ticker = row.get(secSecIdIdx).asText();

                    if (!lastPrices.containsKey(ticker)) continue;

                    String shortName = row.get(secShortNameIdx).asText();
                    String isin = (secIsinIdx != -1 && !row.get(secIsinIdx).isNull()) ? row.get(secIsinIdx).asText() : null;
                    BigDecimal prevPrice = (secPrevPriceIdx != -1 && !row.get(secPrevPriceIdx).isNull())
                            ? new BigDecimal(row.get(secPrevPriceIdx).asText())
                            : lastPrices.get(ticker);

                    // Логика определения типа: если это не облигация, проверяем на ETF
                    int finalTypeId = defaultTypeId;
                    String upperName = shortName.toUpperCase();
                    if (defaultTypeId == 1 && (upperName.contains("ETF") || upperName.contains("ПИФ"))) {
                        finalTypeId = 3; // ETF
                    }

                    securityRepository.upsertSecurityFromMoex(
                            ticker, shortName, isin, lastPrices.get(ticker), prevPrice, finalTypeId
                    );
                    updatedCount++;
                }
            }
        } catch (Exception e) {
            System.out.println("Ошибка синхронизации " + board + ": " + e.getMessage());
        }
        return updatedCount;
    }

    // ИСТОРИЯ КОТИРОВОК (СВЕЧИ ДЛЯ ГРАФИКОВ)
    public List<CandleDto> getHistory(String ticker, String from, String till, String interval) {
        List<CandleDto> candles = new ArrayList<>();

        try {
            String fromDate = (from != null && !from.isEmpty()) ? from : LocalDate.now().minusDays(30).toString();
            String tillDate = (till != null && !till.isEmpty()) ? till : LocalDate.now().toString();
            String intervalParam = (interval != null && !interval.isEmpty()) ? interval : "24";

            // Формируем URL как простую строку
            String url = String.format(
                    "https://iss.moex.com/iss/securities/%s/candles.json?from=%s&till=%s&interval=%s&iss.meta=off",
                    ticker, fromDate, tillDate, intervalParam
            );

            // Используем URI.create, чтобы Spring не ломал строку
            String jsonResponse = restClient.get().uri(URI.create(url)).retrieve().body(String.class);

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

            if (openIdx == -1 || beginIdx == -1 || !candlesNode.path("data").isArray()) {
                return candles;
            }

            for (JsonNode row : candlesNode.path("data")) {
                if (!row.get(openIdx).isNull()) {
                    String beginStr = row.get(beginIdx).asText();
                    if ("24".equals(intervalParam) || "7".equals(intervalParam) || "31".equals(intervalParam)) {
                        beginStr = beginStr.substring(0, 10); // Оставляем только дату
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
            e.printStackTrace();
        }

        return candles;
    }

    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ И ПЛАНИРОВЩИК
    private int getColumnIndex(JsonNode columnsNode, String columnName) {
        for (int i = 0; i < columnsNode.size(); i++) {
            if (columnName.equals(columnsNode.get(i).asText())) return i;
        }
        return -1;
    }

    @Scheduled(fixedRate = 600000, initialDelay = 15000)
    public void scheduledSync() {
        System.out.println("[АВТООБНОВЛЕНИЕ] Запуск синхронизации рынков...");
        int count = syncAllMarket();
        System.out.println("[АВТООБНОВЛЕНИЕ] Завершено. Обновлено/добавлено бумаг: " + count);
    }
}