"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { securityApi } from "@/entities/security/api/securityApi";
import type {
  Security,
  SecurityHistoryItem,
} from "@/entities/security/model/types";
import styles from "./securities.module.scss";

type SyncAction = "all" | "market" | "bonds";
type FilterType = "Все" | "Акции" | "ETF" | "Облигации";

const formatPrice = (value: number, currency = "RUB") =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value ?? 0);

const formatNumber = (value: number) =>
  new Intl.NumberFormat("ru-RU").format(value ?? 0);

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

const getSecurityCategory = (typeName: string): FilterType => {
  const type = (typeName || "").toLowerCase();

  if (type.includes("облигац")) return "Облигации";
  if (type.includes("etf") || type.includes("пиф")) return "ETF";
  return "Акции";
};

export default function SecuritiesPage() {
  const [securities, setSecurities] = useState<Security[]>([]);
  const [selectedSecurity, setSelectedSecurity] = useState<Security | null>(
    null,
  );
  const [history, setHistory] = useState<SecurityHistoryItem[]>([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("Все");
  const [from, setFrom] = useState("");
  const [till, setTill] = useState("");
  const [interval, setInterval] = useState("24");

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [syncing, setSyncing] = useState<SyncAction | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadSecurities = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setError("Войди в аккаунт, чтобы загрузить каталог ценных бумаг.");
      setLoading(false);
      return;
    }

    try {
      setError("");
      const data = await securityApi.getAll(token);
      setSecurities(data);
    } catch (err) {
      console.error("Ошибка загрузки бумаг:", err);
      setError("Не удалось загрузить бумаги. Проверь авторизацию.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSecurities();
  }, [loadSecurities]);

  const statistics = useMemo(() => {
    const stocks = securities.filter(
      (item) => getSecurityCategory(item.typeName) === "Акции",
    ).length;

    const etfs = securities.filter(
      (item) => getSecurityCategory(item.typeName) === "ETF",
    ).length;

    const bonds = securities.filter(
      (item) => getSecurityCategory(item.typeName) === "Облигации",
    ).length;

    return { stocks, etfs, bonds };
  }, [securities]);

  const filteredSecurities = useMemo(() => {
    const query = search.trim().toLowerCase();

    return securities.filter((security) => {
      const matchesSearch =
        !query ||
        [
          security.ticker,
          security.name,
          security.isin,
          security.issuerName,
          security.typeName,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));

      const matchesFilter =
        filter === "Все" || getSecurityCategory(security.typeName) === filter;

      return matchesSearch && matchesFilter;
    });
  }, [securities, search, filter]);

  const handleSync = async (action: SyncAction) => {
    const token = getToken();

    if (!token) {
      setError("Необходимо авторизоваться.");
      return;
    }

    try {
      setSyncing(action);
      setError("");
      setMessage("");

      let result: string;

      if (action === "market") {
        result = await securityApi.syncMarket(token);
      } else if (action === "bonds") {
        result = await securityApi.syncBonds(token);
      } else {
        result = await securityApi.sync(token);
      }

      setMessage(result);
      await loadSecurities();
    } catch (err) {
      console.error("Ошибка синхронизации:", err);
      setError("Не удалось выполнить синхронизацию.");
    } finally {
      setSyncing(null);
    }
  };

  const handleSelectSecurity = async (security: Security) => {
    const token = getToken();

    if (!token) {
      setError("Необходимо авторизоваться.");
      return;
    }

    setSelectedSecurity(security);
    setHistory([]);
    setHistoryLoading(true);
    setError("");

    try {
      const details = await securityApi.getByTicker(security.ticker, token);
      setSelectedSecurity(details);
    } catch (err) {
      console.error("Ошибка загрузки бумаги:", err);
      setError(`Не удалось загрузить данные ${security.ticker}.`);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleLoadHistory = async () => {
    if (!selectedSecurity) return;

    const token = getToken();

    if (!token) {
      setError("Необходимо авторизоваться.");
      return;
    }

    if (from && till && from > till) {
      setError("Начальная дата не может быть позже конечной.");
      return;
    }

    try {
      setHistoryLoading(true);
      setError("");

      const data = await securityApi.getHistory(
        selectedSecurity.ticker,
        token,
        {
          from: from || undefined,
          till: till || undefined,
          interval: interval || undefined,
        },
      );

      setHistory(data);
    } catch (err) {
      console.error("Ошибка истории:", err);
      setError("Не удалось загрузить историю котировок.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedSecurity(null);
    setHistory([]);
    setFrom("");
    setTill("");
    setInterval("24");
  };

  const chartPoints = useMemo(() => {
    if (!history.length) return [];

    return history.filter((item) => Number.isFinite(item.close)).slice(-40);
  }, [history]);

  const chartMin = chartPoints.length
    ? Math.min(...chartPoints.map((item) => item.low))
    : 0;

  const chartMax = chartPoints.length
    ? Math.max(...chartPoints.map((item) => item.high))
    : 0;

  const chartRange = chartMax - chartMin || 1;

  const chartLine = chartPoints
    .map((item, index) => {
      const x =
        chartPoints.length === 1
          ? 50
          : (index / (chartPoints.length - 1)) * 100;

      const y = 100 - ((item.close - chartMin) / chartRange) * 85 - 7;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>ИНВЕСТИЦИОННЫЙ ПОРТФЕЛЬ</span>
            <h1 className={styles.title}>Ценные бумаги</h1>
            <p className={styles.subtitle}>
              Каталог финансовых инструментов и рыночных котировок
            </p>
          </div>

          <button
            className={styles.refreshButton}
            onClick={() => void loadSecurities()}
            disabled={loading}
          >
            ↻ Обновить данные
          </button>
        </header>

        {error && <div className={styles.errorMessage}>{error}</div>}

        {message && <div className={styles.successMessage}>{message}</div>}

        <section className={styles.statsGrid}>
          <article className={styles.statCard}>
            <span>Всего инструментов</span>
            <strong>{formatNumber(securities.length)}</strong>
            <small>В базе данных</small>
          </article>

          <article className={styles.statCard}>
            <span>Акции</span>
            <strong>{formatNumber(statistics.stocks)}</strong>
            <small>Долевые инструменты</small>
          </article>

          <article className={styles.statCard}>
            <span>ETF</span>
            <strong>{formatNumber(statistics.etfs)}</strong>
            <small>Биржевые фонды</small>
          </article>

          <article className={styles.statCard}>
            <span>Облигации</span>
            <strong>{formatNumber(statistics.bonds)}</strong>
            <small>Долговые инструменты</small>
          </article>
        </section>

        <section className={styles.syncPanel}>
          <div>
            <h2>Обновление котировок</h2>
            <p>Синхронизация каталога с Московской биржей</p>
          </div>

          <div className={styles.syncButtons}>
            <button
              className={styles.primaryButton}
              onClick={() => void handleSync("all")}
              disabled={syncing !== null}
            >
              {syncing === "all" ? "Обновление..." : "Синхронизировать всё"}
            </button>

            <button
              className={styles.secondaryButton}
              onClick={() => void handleSync("market")}
              disabled={syncing !== null}
            >
              {syncing === "market" ? "Загрузка..." : "Акции и ETF"}
            </button>

            <button
              className={styles.secondaryButton}
              onClick={() => void handleSync("bonds")}
              disabled={syncing !== null}
            >
              {syncing === "bonds" ? "Загрузка..." : "Облигации"}
            </button>
          </div>
        </section>

        <section className={styles.catalogPanel}>
          <div className={styles.catalogHeader}>
            <div>
              <h2>Каталог инструментов</h2>
              <p>Найдено инструментов: {filteredSecurities.length}</p>
            </div>
          </div>

          <input
            className={styles.searchInput}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по тикеру, названию, ISIN или эмитенту..."
          />

          <div className={styles.filterTabs}>
            {(["Все", "Акции", "ETF", "Облигации"] as FilterType[]).map(
              (item) => (
                <button
                  key={item}
                  className={
                    filter === item ? styles.activeFilter : styles.filterButton
                  }
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ),
            )}
          </div>

          {loading ? (
            <div className={styles.emptyState}>Загрузка каталога...</div>
          ) : filteredSecurities.length === 0 ? (
            <div className={styles.emptyState}>
              <strong>Инструменты не найдены</strong>
              <p>
                {securities.length === 0
                  ? "В каталоге пока нет данных. Попробуй синхронизировать инструменты."
                  : "Измени поисковый запрос или категорию."}
              </p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Инструмент</th>
                    <th>Тип</th>
                    <th>Цена</th>
                    <th>Изменение</th>
                    <th>Эмитент</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSecurities.map((security) => {
                    const category = getSecurityCategory(security.typeName);

                    return (
                      <tr key={security.idSecurity}>
                        <td>
                          <div className={styles.instrument}>
                            <strong>{security.ticker}</strong>
                            <span>{security.name}</span>
                          </div>
                        </td>

                        <td>
                          <span className={styles.typeBadge}>{category}</span>
                        </td>

                        <td className={styles.price}>
                          {formatPrice(
                            security.currentPrice,
                            security.currencyCode,
                          )}
                        </td>

                        <td>
                          <span
                            className={
                              security.dailyChangePercent > 0
                                ? styles.positive
                                : security.dailyChangePercent < 0
                                  ? styles.negative
                                  : styles.neutral
                            }
                          >
                            {security.dailyChangePercent > 0 ? "+" : ""}
                            {security.dailyChangePercent}%
                          </span>
                        </td>

                        <td className={styles.issuer}>
                          {security.issuerName || "—"}
                        </td>

                        <td>
                          <button
                            className={styles.detailsButton}
                            onClick={() => void handleSelectSecurity(security)}
                          >
                            Открыть →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selectedSecurity && (
          <section className={styles.detailsPanel}>
            <div className={styles.detailsHeader}>
              <div>
                <span className={styles.eyebrow}>
                  ИНФОРМАЦИЯ ОБ ИНСТРУМЕНТЕ
                </span>
                <h2>{selectedSecurity.name}</h2>
                <p>
                  {selectedSecurity.ticker} · {selectedSecurity.isin}
                </p>
              </div>

              <button className={styles.closeButton} onClick={closeDetails}>
                Закрыть
              </button>
            </div>

            <div className={styles.detailsGrid}>
              <div>
                <span>Текущая цена</span>
                <strong>
                  {formatPrice(
                    selectedSecurity.currentPrice,
                    selectedSecurity.currencyCode,
                  )}
                </strong>
              </div>

              <div>
                <span>Изменение в рублях</span>
                <strong>
                  {formatPrice(
                    selectedSecurity.dailyChangeRub,
                    selectedSecurity.currencyCode,
                  )}
                </strong>
              </div>

              <div>
                <span>Изменение за день</span>
                <strong
                  className={
                    selectedSecurity.dailyChangePercent >= 0
                      ? styles.positive
                      : styles.negative
                  }
                >
                  {selectedSecurity.dailyChangePercent > 0 ? "+" : ""}
                  {selectedSecurity.dailyChangePercent}%
                </strong>
              </div>

              <div>
                <span>Эмитент</span>
                <strong>{selectedSecurity.issuerName || "Не указан"}</strong>
              </div>
            </div>

            <div className={styles.historySection}>
              <div className={styles.historyHeader}>
                <div>
                  <h3>История котировок</h3>
                  <p>Исторические цены выбранного инструмента</p>
                </div>
              </div>

              <div className={styles.historyFilters}>
                <label>
                  Начало периода
                  <input
                    type="date"
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                  />
                </label>

                <label>
                  Конец периода
                  <input
                    type="date"
                    value={till}
                    onChange={(event) => setTill(event.target.value)}
                  />
                </label>

                <label>
                  Интервал MOEX
                  <input
                    value={interval}
                    onChange={(event) => setInterval(event.target.value)}
                    placeholder="Например, 24"
                  />
                </label>

                <button
                  className={styles.primaryButton}
                  onClick={() => void handleLoadHistory()}
                  disabled={historyLoading}
                >
                  {historyLoading ? "Загрузка..." : "Показать историю"}
                </button>
              </div>

              {historyLoading ? (
                <div className={styles.emptyState}>
                  Загрузка истории котировок...
                </div>
              ) : history.length > 0 ? (
                <>
                  <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                      <span>Динамика цены закрытия</span>
                      <strong>
                        {formatPrice(
                          history[history.length - 1].close,
                          selectedSecurity.currencyCode,
                        )}
                      </strong>
                    </div>

                    <div className={styles.chart}>
                      <div className={styles.chartLabels}>
                        <span>
                          {formatPrice(chartMax, selectedSecurity.currencyCode)}
                        </span>
                        <span>
                          {formatPrice(chartMin, selectedSecurity.currencyCode)}
                        </span>
                      </div>

                      <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        role="img"
                        aria-label="График изменения цены"
                      >
                        <line x1="0" y1="10" x2="100" y2="10" />
                        <line x1="0" y1="50" x2="100" y2="50" />
                        <line x1="0" y1="90" x2="100" y2="90" />

                        {chartPoints.length > 1 && (
                          <polyline
                            points={chartLine}
                            className={styles.chartLine}
                          />
                        )}
                      </svg>
                    </div>

                    <div className={styles.chartDates}>
                      <span>{chartPoints[0]?.begin}</span>
                      <span>{chartPoints[chartPoints.length - 1]?.begin}</span>
                    </div>
                  </div>

                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Дата</th>
                          <th>Открытие</th>
                          <th>Максимум</th>
                          <th>Минимум</th>
                          <th>Закрытие</th>
                          <th>Объём</th>
                        </tr>
                      </thead>

                      <tbody>
                        {[...history].reverse().map((item, index) => (
                          <tr key={`${item.begin}-${index}`}>
                            <td>{item.begin}</td>
                            <td>{item.open}</td>
                            <td>{item.high}</td>
                            <td>{item.low}</td>
                            <td>{item.close}</td>
                            <td>{formatNumber(item.volume)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>
                  Выбери период и нажми «Показать историю».
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
