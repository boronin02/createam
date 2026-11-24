"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import { securityApi } from "@/entities/security/api/securityApi";
import type {
  Security,
  SecurityHistory,
} from "@/entities/security/model/types";

import styles from "./Dashboard.module.scss";

export function Dashboard() {
  const router = useRouter();

  const [securities, setSecurities] = useState<Security[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);

  const [selectedSecurity, setSelectedSecurity] = useState<Security | null>(
    null,
  );

  const [history, setHistory] = useState<SecurityHistory[]>([]);

  const [from, setFrom] = useState("");
  const [till, setTill] = useState("");
  const [interval, setInterval] = useState("");

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [error, setError] = useState("");

  const visibleSecurities = securities.slice(0, visibleCount);

  // Загрузка всех ценных бумаг
  useEffect(() => {
    const fetchSecurities = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/auth");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await securityApi.getAll(token);

        setSecurities(data);
        setVisibleCount(10);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("username");
            router.replace("/auth");
            return;
          }

          setError(
            err.response?.data?.message || "Не удалось загрузить ценные бумаги",
          );
        } else {
          setError("Произошла неизвестная ошибка");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSecurities();
  }, [router]);

  // Показать ещё 5 бумаг
  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 5);
  };

  // Закрыть модальное окно
  const handleCloseModal = () => {
    setSelectedSecurity(null);
    setHistory([]);
    setError("");
    setFrom("");
    setTill("");
    setInterval("");
  };

  // Загрузка истории торгов
  const fetchHistory = async (ticker: string, token: string) => {
    try {
      setHistoryLoading(true);
      setHistory([]);

      const data = await securityApi.getHistory(ticker, token, {
        from: from || undefined,
        till: till || undefined,
        interval: interval || undefined,
      });

      setHistory(data);
    } catch (err) {
      console.error("Ошибка загрузки истории:", err);
      setError("Не удалось загрузить историю торгов");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Выбор ценной бумаги и открытие окна
  const handleSelectSecurity = async (ticker: string) => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/auth");
      return;
    }

    setSelectedSecurity(null);
    setHistory([]);
    setError("");
    setDetailsLoading(true);

    try {
      const data = await securityApi.getByTicker(ticker, token);

      setSelectedSecurity(data);

      await fetchHistory(ticker, token);
    } catch (err) {
      console.error("Ошибка получения бумаги:", err);
      setError("Не удалось загрузить информацию о ценной бумаге");
    } finally {
      setDetailsLoading(false);
    }
  };

  // Применение фильтров истории
  const handleFilterHistory = async () => {
    if (!selectedSecurity) return;

    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/auth");
      return;
    }

    setError("");
    await fetchHistory(selectedSecurity.ticker, token);
  };

  if (loading) {
    return <div className={styles.message}>Загрузка ценных бумаг...</div>;
  }

  return (
    <section className={styles.dashboard}>
      <h1 className={styles.title}>Биржа ценных бумаг</h1>

      {error && !selectedSecurity && <p className={styles.error}>{error}</p>}

      {/* Единый блок ценных бумаг */}
      <div className={styles.securities}>
        <h2>Все ценные бумаги</h2>

        {securities.length === 0 ? (
          <p>Ценные бумаги не найдены</p>
        ) : (
          <>
            <div className={styles.securityList}>
              {visibleSecurities.map((security) => (
                <button
                  key={security.idSecurity}
                  type="button"
                  className={styles.securityItem}
                  onClick={() => handleSelectSecurity(security.ticker)}
                >
                  <div className={styles.securityMain}>
                    <span className={styles.ticker}>{security.ticker}</span>

                    <span className={styles.securityName}>{security.name}</span>
                  </div>

                  <div className={styles.securityPrice}>
                    <span>
                      {security.currentPrice} {security.currencyCode}
                    </span>

                    <span
                      className={
                        security.dailyChangePercent >= 0
                          ? styles.positive
                          : styles.negative
                      }
                    >
                      {security.dailyChangePercent > 0 ? "+" : ""}
                      {security.dailyChangePercent}%
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {visibleCount < securities.length && (
              <button
                type="button"
                className={styles.showMore}
                onClick={handleShowMore}
              >
                Показать ещё
              </button>
            )}
          </>
        )}
      </div>

      {/* Модальное окно */}
      {(detailsLoading || selectedSecurity) && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.closeButton}
              onClick={handleCloseModal}
              aria-label="Закрыть"
            >
              ×
            </button>

            {detailsLoading ? (
              <p className={styles.message}>Загрузка информации...</p>
            ) : selectedSecurity ? (
              <>
                <div className={styles.modalHeader}>
                  <h2>{selectedSecurity.name}</h2>

                  <span className={styles.modalTicker}>
                    {selectedSecurity.ticker}
                  </span>
                </div>

                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.securityDetails}>
                  <div className={styles.detailItem}>
                    <span>ISIN</span>
                    <strong>{selectedSecurity.isin}</strong>
                  </div>

                  <div className={styles.detailItem}>
                    <span>Текущая цена</span>
                    <strong>
                      {selectedSecurity.currentPrice}{" "}
                      {selectedSecurity.currencyCode}
                    </strong>
                  </div>

                  <div className={styles.detailItem}>
                    <span>Изменение за день</span>
                    <strong>{selectedSecurity.dailyChangeRub} руб.</strong>
                  </div>

                  <div className={styles.detailItem}>
                    <span>Изменение в процентах</span>
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

                  <div className={styles.detailItem}>
                    <span>Тип бумаги</span>
                    <strong>{selectedSecurity.typeName}</strong>
                  </div>

                  <div className={styles.detailItem}>
                    <span>Эмитент</span>
                    <strong>{selectedSecurity.issuerName}</strong>
                  </div>
                </div>

                {/* История торгов */}
                <div className={styles.history}>
                  <h3>История торгов</h3>

                  <div className={styles.filters}>
                    <label>
                      От:
                      <input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                      />
                    </label>

                    <label>
                      До:
                      <input
                        type="date"
                        value={till}
                        onChange={(e) => setTill(e.target.value)}
                      />
                    </label>

                    <label>
                      Интервал:
                      <input
                        type="text"
                        placeholder="Например: 1d"
                        value={interval}
                        onChange={(e) => setInterval(e.target.value)}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleFilterHistory}
                      disabled={historyLoading}
                    >
                      Применить
                    </button>
                  </div>

                  {historyLoading ? (
                    <p>Загрузка истории...</p>
                  ) : history.length === 0 ? (
                    <p>Исторические данные отсутствуют</p>
                  ) : (
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
                          {history.map((item, index) => (
                            <tr key={`${item.begin}-${index}`}>
                              <td>{item.begin}</td>
                              <td>{item.open}</td>
                              <td>{item.high}</td>
                              <td>{item.low}</td>
                              <td>{item.close}</td>
                              <td>{item.volume}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
