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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MoexService {

    private final SecurityRepository securityRepository;
    private final RestClient restClient = createMoexRestClient();

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
            e.printStackTrace();
        }
        return updatedCount;
    }

    // ИСТОРИЯ КОТИРОВОК (СВЕЧИ ДЛЯ ГРАФИКОВ)
    public List<CandleDto> getHistory(String ticker, String from, String till, String interval) {
        List<CandleDto> candles = new ArrayList<>();

        try {
            String cleanTicker = ticker.toUpperCase().trim();

            // Получаем id_type из БД (1 - акция, 2 - облигация, 3 - ETF)
            Integer typeId = securityRepository.getSecurityTypeId(cleanTicker);

            // Для облигаций (2) берем рынок bonds и борд TQCB, для акций (1) и ETF (3) - shares и TQBR
            String market = (typeId != null && typeId == 2) ? "bonds" : "shares";
            String board = (typeId != null && typeId == 2) ? "TQCB" : "TQBR";

            String fromDate = (from != null && !from.isEmpty()) ? from : LocalDate.now().minusDays(30).toString();
            String tillDate = (till != null && !till.isEmpty()) ? till : LocalDate.now().toString();
            String intervalParam = (interval != null && !interval.isEmpty()) ? interval : "24";

            // Формируем полный URL с указанием движка, рынка и режима торгов
            String url = String.format(
                    "https://iss.moex.com/iss/engines/stock/markets/%s/boards/%s/securities/%s/candles.json?from=%s&till=%s&interval=%s&iss.meta=off",
                    market, board, cleanTicker, fromDate, tillDate, intervalParam);

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
                        beginStr = beginStr.substring(0, 10); // Оставляем только дату (YYYY-MM-DD)
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

    private static RestClient createMoexRestClient() {
        try {
            KeyStore keyStore = KeyStore.getInstance(KeyStore.getDefaultType());
            keyStore.load(null, null);

            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            String[] certPaths = {
                    "certs/russian_trusted_root_ca.cer",
                    "certs/russian_trusted_sub_ca.cer"
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
}
