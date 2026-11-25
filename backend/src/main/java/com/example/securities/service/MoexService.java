package com.example.securities.service;

import com.example.securities.dto.CandleDto;
import com.example.securities.repository.SecurityRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;
import java.io.InputStream;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.security.KeyStore;
import java.security.cert.CertificateFactory;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class MoexService {

    private final SecurityRepository securityRepository;
    private final RestClient restClient = createMoexRestClient();
    private final ObjectMapper mapper = new ObjectMapper();

    // Допустимые интервалы MOEX ISS: 1м, 10м, 1ч, 1д, 1н, 1мес
    private static final Set<String> VALID_INTERVALS = Set.of("1", "10", "60", "24", "7", "31");

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
            JsonNode root = mapper.readTree(jsonResponse);

            Map<String, BigDecimal> lastPrices = new HashMap<>();

            JsonNode marketData = root.path("marketdata");
            JsonNode mdColumns = marketData.path("columns");
            int mdSecIdIdx = getColumnIndex(mdColumns, "SECID");
            int mdLastIdx = getColumnIndex(mdColumns, "LAST");

            if (mdSecIdIdx != -1 && mdLastIdx != -1) {
                for (JsonNode row : marketData.path("data")) {
                    String lastStr = row.get(mdLastIdx).asText().trim();
                    if (!row.get(mdLastIdx).isNull() && !lastStr.isEmpty()) {
                        lastPrices.put(row.get(mdSecIdIdx).asText(), new BigDecimal(lastStr));
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
                    BigDecimal lastPrice = lastPrices.get(ticker);

                    if (lastPrice == null) continue;

                    String shortName = row.get(secShortNameIdx).asText();
                    String isin = (secIsinIdx != -1 && !row.get(secIsinIdx).isNull())
                            ? row.get(secIsinIdx).asText()
                            : null;

                    BigDecimal prevPrice = (secPrevPriceIdx != -1) ? parseBigDecimal(row.get(secPrevPriceIdx)) : null;
                    if (prevPrice == null) {
                        prevPrice = lastPrice;
                    }

                    int finalTypeId = defaultTypeId;
                    String upperName = shortName.toUpperCase();
                    if (defaultTypeId == 1 && (upperName.contains("ETF") || upperName.contains("ПИФ"))) {
                        finalTypeId = 3; // ETF
                    }

                    securityRepository.upsertSecurityFromMoex(
                            ticker, shortName, isin, lastPrice, prevPrice, finalTypeId
                    );
                    updatedCount++;
                }
            }
        } catch (Exception e) {
            System.out.println("Ошибка синхронизации " + board + ": " + e.getMessage());
            e.printStackTrace();
        }
        return updatedCount;
    }

    // ИСТОРИЯ КОТИРОВОК (СВЕЧИ ДЛЯ ГРАФИКОВ)
    public List<CandleDto> getHistory(String ticker, String from, String till, String interval) {
        List<CandleDto> candles = new ArrayList<>();

        try {
            String cleanTicker = ticker.toUpperCase().trim();
            Integer typeId = securityRepository.getSecurityTypeId(cleanTicker);

            String market = (typeId != null && typeId == 2) ? "bonds" : "shares";
            String board = (typeId != null && typeId == 2) ? "TQCB" : "TQBR";

            // Валидируем интервал (по умолчанию "24" - 1 день)
            String intervalParam = (interval != null && VALID_INTERVALS.contains(interval.trim()))
                    ? interval.trim()
                    : "24";

            // Автоподбор даты начала графика под выбранный интервал, если from не передан
            String fromDate = (from != null && !from.isBlank()) ? from.trim() : getDefaultFromDate(intervalParam);
            String tillDate = (till != null && !till.isBlank()) ? till.trim() : LocalDate.now().toString();

            String url = String.format(
                    "https://moex.com",
                    market, board, cleanTicker, fromDate, tillDate, intervalParam
            );

            String jsonResponse = restClient.get().uri(URI.create(url)).retrieve().body(String.class);
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
                BigDecimal open = parseBigDecimal(row.get(openIdx));
                if (open != null) {
                    String beginStr = row.get(beginIdx).asText();
                    if ("24".equals(intervalParam) || "7".equals(intervalParam) || "31".equals(intervalParam)) {
                        beginStr = beginStr.substring(0, 10);
                    }

                    candles.add(new CandleDto(
                            beginStr,
                            open,
                            parseBigDecimal(row.get(highIdx)),
                            parseBigDecimal(row.get(lowIdx)),
                            parseBigDecimal(row.get(closeIdx)),
                            parseBigDecimal(row.get(volumeIdx))
                    ));
                }
            }
        } catch (Exception e) {
            System.out.println("Ошибка получения истории для " + ticker + ": " + e.getMessage());
            e.printStackTrace();
        }

        return candles;
    }

    private static RestClient createMoexRestClient() {
        try {
            KeyStore keyStore = KeyStore.getInstance(KeyStore.getDefaultType());
            keyStore.load(null, null);

            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            String[] certPaths = {
                    "certs/Russian_Trusted_Root_CA.cer",
                    "certs/Russian_Trusted_Sub_CA.cer"
            };

            for (int i = 0; i < certPaths.length; i++) {
                try (InputStream is = new ClassPathResource(certPaths[i]).getInputStream()) {
                    keyStore.setCertificateEntry("russian_ca_" + i, cf.generateCertificate(is));
                }
            }

            TrustManagerFactory tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
            tmf.init(keyStore);

            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, tmf.getTrustManagers(), null);

            HttpClient httpClient = HttpClient.newBuilder()
                    .sslContext(sslContext)
                    .build();

            return RestClient.builder()
                    .requestFactory(new JdkClientHttpRequestFactory(httpClient))
                    .defaultHeader("Accept", "application/json")
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Ошибка инициализации SSL для MOEX", e);
        }
    }

    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ И ПЛАНИРОВЩИК
    private int getColumnIndex(JsonNode columnsNode, String columnName) {
        for (int i = 0; i < columnsNode.size(); i++) {
            if (columnName.equals(columnsNode.get(i).asText())) return i;
        }
        return -1;
    }

    private String getDefaultFromDate(String interval) {
        return switch (interval) {
            case "1" -> LocalDate.now().minusDays(1).toString();
            case "10" -> LocalDate.now().minusDays(5).toString();
            case "60" -> LocalDate.now().minusDays(30).toString();
            case "7" -> LocalDate.now().minusYears(3).toString();
            case "31" -> LocalDate.now().minusYears(10).toString();
            default -> LocalDate.now().minusMonths(6).toString(); // для "24" (дневные свечи)
        };
    }

    private BigDecimal parseBigDecimal(JsonNode node) {
        if (node == null || node.isNull()) return null;
        String val = node.asText().trim();
        if (val.isEmpty()) return null;
        try {
            return new BigDecimal(val);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    //Каждые 10 минут, после 15 секунд после запуска
    @Scheduled(fixedRate = 600000, initialDelay = 15000)
    public void scheduledSync() {
        System.out.println("[АВТООБНОВЛЕНИЕ] Запуск синхронизации рынков...");
        int count = syncAllMarket();
        System.out.println("[АВТООБНОВЛЕНИЕ] Завершено. Обновлено/добавлено бумаг: " + count);
    }
}
