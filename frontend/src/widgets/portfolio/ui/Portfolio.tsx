"use client";

import { useCallback, useEffect, useState } from "react";

import { accountApi } from "@/entities/account/api/accountApi";
import type { Account } from "@/entities/account/model/types";

import { portfolioApi } from "@/entities/portfolio/api/portfolioApi";
import type {
  PortfolioItem,
  PortfolioSummary,
} from "@/entities/portfolio/model/types";

import { securityApi } from "@/entities/security/api/securityApi";
import type { Security } from "@/entities/security/model/types";

import { operationApi } from "@/entities/operation/api/operationApi";
import { OPERATION_TYPES } from "@/entities/operation/model/types";

import styles from "./Portfolio.module.scss";

type TradeMode = "buy" | "sell";

export function Portfolio() {
  // Счета
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | "">("");

  // Портфель
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);

  // Каталог бумаг
  const [securities, setSecurities] = useState<Security[]>([]);

  // Загрузка
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  // Сообщения
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Торговая форма
  const [tradeMode, setTradeMode] = useState<TradeMode | null>(null);
  const [selectedSecurityId, setSelectedSecurityId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [commission, setCommission] = useState("0");

  const [tradeError, setTradeError] = useState("");
  const [tradeLoading, setTradeLoading] = useState(false);

  // Модальное окно открытия счёта
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);

  // Форматирование денежных значений
  const formatMoney = (value: number) =>
    new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  // Выбранный счёт
  const selectedAccount = accounts.find(
    (account) => account.idAccount === selectedAccountId,
  );

  // Выбранная бумага
  const selectedSecurity =
    tradeMode === "buy"
      ? securities.find(
          (security) => String(security.idSecurity) === selectedSecurityId,
        )
      : items.find((item) => String(item.idSecurity) === selectedSecurityId);

  // Расчёт сделки
  const tradeAmount = (Number(quantity) || 0) * (Number(price) || 0);

  const tradeTotal =
    tradeMode === "sell"
      ? tradeAmount - (Number(commission) || 0)
      : tradeAmount + (Number(commission) || 0);

  // Загрузка счетов и каталога
  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Необходимо авторизоваться.");
          return;
        }

        const [accountsData, securitiesData] = await Promise.all([
          accountApi.getMyAccounts(token),
          securityApi.getAll(token),
        ]);

        if (cancelled) return;

        setAccounts(accountsData);
        setSecurities(securitiesData);

        if (accountsData.length > 0) {
          setSelectedAccountId(accountsData[0].idAccount);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Ошибка загрузки начальных данных:", err);
          setError("Не удалось загрузить счета или список бумаг.");
        }
      } finally {
        if (!cancelled) {
          setAccountsLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Обновление портфеля после операции
  const refreshPortfolio = useCallback(
    async (token: string, accountId: number) => {
      const [portfolioData, summaryData] = await Promise.all([
        portfolioApi.getPortfolio(accountId, token),
        portfolioApi.getSummary(accountId, token),
      ]);

      setItems(portfolioData);
      setSummary(summaryData);
    },
    [],
  );

  // Загрузка портфеля при выборе счёта
  useEffect(() => {
    if (selectedAccountId === "") {
      setItems([]);
      setSummary(null);
      return;
    }

    let cancelled = false;

    const loadPortfolio = async () => {
      setPortfolioLoading(true);
      setError("");
      setItems([]);
      setSummary(null);

      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Необходимо авторизоваться.");
          return;
        }

        const [portfolioData, summaryData] = await Promise.all([
          portfolioApi.getPortfolio(selectedAccountId, token),
          portfolioApi.getSummary(selectedAccountId, token),
        ]);

        if (cancelled) return;

        setItems(portfolioData);
        setSummary(summaryData);
      } catch (err) {
        if (!cancelled) {
          console.error("Ошибка загрузки портфеля:", err);
          setItems([]);
          setSummary(null);
          setError("Не удалось загрузить портфель.");
        }
      } finally {
        if (!cancelled) {
          setPortfolioLoading(false);
        }
      }
    };

    loadPortfolio();

    return () => {
      cancelled = true;
    };
  }, [selectedAccountId]);

  // Сброс торговой формы
  const resetTradeForm = () => {
    setSelectedSecurityId("");
    setQuantity("1");
    setPrice("");
    setCommission("0");
    setTradeError("");
  };

  // Открытие покупки
  const openBuyModal = () => {
    if (accounts.length === 0) {
      setError("Сначала необходимо открыть инвестиционный счёт.");
      return;
    }

    if (securities.length === 0) {
      setError("Список ценных бумаг пуст.");
      return;
    }

    const firstSecurity = securities[0];

    resetTradeForm();

    setSelectedSecurityId(String(firstSecurity.idSecurity));
    setPrice(String(firstSecurity.currentPrice));
    setTradeMode("buy");
    setError("");
    setSuccess("");
  };

  // Открытие продажи
  const openSellModal = () => {
    if (accounts.length === 0) {
      setError("Сначала необходимо открыть инвестиционный счёт.");
      return;
    }

    if (items.length === 0) {
      setError("В портфеле нет бумаг для продажи.");
      return;
    }

    const firstItem = items[0];

    resetTradeForm();

    setSelectedSecurityId(String(firstItem.idSecurity));
    setPrice(String(firstItem.currentPrice));
    setTradeMode("sell");
    setError("");
    setSuccess("");
  };

  // Выбор бумаги
  const handleSecurityChange = (id: string) => {
    setSelectedSecurityId(id);

    const security =
      tradeMode === "buy"
        ? securities.find((item) => String(item.idSecurity) === id)
        : items.find((item) => String(item.idSecurity) === id);

    if (security) {
      setPrice(String(security.currentPrice));
    }
  };

  // Закрытие торгового окна
  const closeTradeModal = () => {
    if (tradeLoading) return;

    setTradeMode(null);
    setTradeError("");
  };

  // Закрытие окон по Escape
  useEffect(() => {
    const isAnyModalOpen = tradeMode !== null || isCreateAccountOpen;

    if (!isAnyModalOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || tradeLoading) return;

      setTradeMode(null);
      setTradeError("");
      setIsCreateAccountOpen(false);
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [tradeMode, isCreateAccountOpen, tradeLoading]);

  // Покупка или продажа
  const handleTrade = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!tradeMode || selectedAccountId === "" || !selectedSecurity) {
      setTradeError("Выберите счёт и ценную бумагу.");
      return;
    }

    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(price);
    const parsedCommission = Number(commission);

    if (!Number.isSafeInteger(parsedQuantity) || parsedQuantity <= 0) {
      setTradeError("Количество должно быть положительным целым числом.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setTradeError("Укажите корректную цену.");
      return;
    }

    if (!Number.isFinite(parsedCommission) || parsedCommission < 0) {
      setTradeError("Комиссия не может быть отрицательной.");
      return;
    }

    const amount = parsedQuantity * parsedPrice;

    if (!Number.isFinite(amount)) {
      setTradeError("Слишком большая сумма операции.");
      return;
    }

    if (tradeMode === "sell" && parsedCommission > amount) {
      setTradeError("Комиссия не может превышать сумму продажи.");
      return;
    }

    if (tradeMode === "sell") {
      const portfolioItem = selectedSecurity as PortfolioItem;

      if (parsedQuantity > portfolioItem.quantity) {
        setTradeError(
          `Недостаточно бумаг. Доступно: ${portfolioItem.quantity}.`,
        );
        return;
      }
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setTradeError("Необходимо авторизоваться.");
      return;
    }

    setTradeLoading(true);
    setTradeError("");

    try {
      const response = await operationApi.create(
        {
          idAccount: selectedAccountId,
          idSecurity: selectedSecurity.idSecurity,
          idOperationType:
            tradeMode === "buy" ? OPERATION_TYPES.BUY : OPERATION_TYPES.SELL,
          quantity: parsedQuantity,
          price: parsedPrice,
          commission: parsedCommission,
        },
        token,
      );

      await refreshPortfolio(token, selectedAccountId);

      const completedMode = tradeMode;

      setTradeMode(null);
      resetTradeForm();

      setSuccess(
        response ||
          (completedMode === "buy"
            ? "Покупка успешно выполнена."
            : "Продажа успешно выполнена."),
      );
    } catch (err: unknown) {
      console.error("Ошибка выполнения операции:", err);

      const errorMessage = (
        err as {
          response?: {
            data?: string;
          };
        }
      ).response?.data;

      setTradeError(
        typeof errorMessage === "string"
          ? errorMessage
          : "Не удалось выполнить операцию. Проверьте данные и попробуйте ещё раз.",
      );
    } finally {
      setTradeLoading(false);
    }
  };

  // Загрузка счетов
  if (accountsLoading) {
    return <div className={styles.message}>Загрузка счетов...</div>;
  }

  return (
    <section className={styles.portfolio}>
      {/* Шапка */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Мой портфель</h1>
          <p className={styles.subtitle}>
            Управление инвестициями и ценными бумагами
          </p>
        </div>

        {accounts.length > 0 && (
          <div className={styles.accountSelect}>
            <label htmlFor="account">Инвестиционный счёт</label>

            <select
              id="account"
              value={selectedAccountId}
              onChange={(event) =>
                setSelectedAccountId(Number(event.target.value))
              }
            >
              {accounts.map((account) => (
                <option key={account.idAccount} value={account.idAccount}>
                  {account.name} — {account.accountNumber}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Сообщения */}
      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      {/* Нет счетов */}
      {accounts.length === 0 && (
        <div className={styles.emptyState}>
          <h2>У вас пока нет открытых счетов</h2>

          <p>
            Для покупки и продажи ценных бумаг необходимо выбрать инвестиционный
            счёт.
          </p>

          <button
            type="button"
            className={styles.openAccountButton}
            onClick={() => {
              setError("");
              setIsCreateAccountOpen(true);
            }}
          >
            Открыть счёт
          </button>
        </div>
      )}

      {/* Содержимое портфеля */}
      {accounts.length > 0 && (
        <>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.buyButton}
              onClick={openBuyModal}
              disabled={securities.length === 0 || portfolioLoading}
            >
              + Купить бумаги
            </button>

            <button
              type="button"
              className={styles.sellButton}
              onClick={openSellModal}
              disabled={items.length === 0 || portfolioLoading}
            >
              − Продать бумаги
            </button>
          </div>

          {portfolioLoading ? (
            <div className={styles.message}>Загрузка портфеля...</div>
          ) : (
            <>
              {summary && (
                <div className={styles.summary}>
                  <div className={styles.summaryCard}>
                    <span>Количество активов</span>
                    <strong>{summary.totalAssets}</strong>
                  </div>

                  <div className={styles.summaryCard}>
                    <span>Общая стоимость</span>
                    <strong>{formatMoney(summary.totalValue)}</strong>
                  </div>

                  <div className={styles.summaryCard}>
                    <span>Прибыль / убыток</span>
                    <strong
                      className={
                        summary.totalPnl >= 0
                          ? styles.positive
                          : styles.negative
                      }
                    >
                      {summary.totalPnl > 0 ? "+" : ""}
                      {formatMoney(summary.totalPnl)}
                    </strong>
                  </div>
                </div>
              )}

              <div className={styles.tableContainer}>
                <h2 className={styles.sectionTitle}>Активы в портфеле</h2>

                {items.length === 0 ? (
                  <p className={styles.message}>
                    В этом портфеле пока нет ценных бумаг.
                  </p>
                ) : (
                  <div className={styles.tableScroll}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Тикер</th>
                          <th>Название</th>
                          <th>Количество</th>
                          <th>Средняя цена</th>
                          <th>Текущая цена</th>
                          <th>Стоимость</th>
                          <th>Прибыль / убыток</th>
                        </tr>
                      </thead>

                      <tbody>
                        {items.map((item) => (
                          <tr key={`${item.idAccount}-${item.idSecurity}`}>
                            <td className={styles.ticker}>{item.ticker}</td>
                            <td>{item.securityName}</td>
                            <td>{item.quantity}</td>
                            <td>{formatMoney(item.averagePurchasePrice)}</td>
                            <td>{formatMoney(item.currentPrice)}</td>
                            <td>{formatMoney(item.currentValue)}</td>
                            <td
                              className={
                                item.unrealizedPnl >= 0
                                  ? styles.positive
                                  : styles.negative
                              }
                            >
                              {item.unrealizedPnl > 0 ? "+" : ""}
                              {formatMoney(item.unrealizedPnl)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* Модальное окно покупки */}
      {tradeMode === "buy" && (
        <div
          className={styles.modalOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeTradeModal();
            }
          }}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="buyModalTitle"
          >
            <button
              type="button"
              className={styles.closeButton}
              onClick={closeTradeModal}
              disabled={tradeLoading}
              aria-label="Закрыть"
            >
              ×
            </button>

            <div className={styles.modalHeader}>
              <span className={styles.buyIcon}>+</span>
              <div>
                <h2 id="buyModalTitle">Покупка ценных бумаг</h2>
                <p>Оформление заявки на покупку</p>
              </div>
            </div>

            <div className={styles.tradeAccount}>
              <span>Инвестиционный счёт</span>
              <strong>{selectedAccount?.name}</strong>
              <small>{selectedAccount?.accountNumber}</small>
            </div>

            <form onSubmit={handleTrade} className={styles.tradeForm}>
              <label htmlFor="buySecurity">Ценная бумага</label>

              <select
                id="buySecurity"
                value={selectedSecurityId}
                onChange={(event) => handleSecurityChange(event.target.value)}
                disabled={tradeLoading}
                required
              >
                {securities.map((security) => (
                  <option key={security.idSecurity} value={security.idSecurity}>
                    {security.ticker} — {security.name}
                  </option>
                ))}
              </select>

              <label htmlFor="buyQuantity">Количество</label>
              <input
                id="buyQuantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                disabled={tradeLoading}
                required
              />

              <label htmlFor="buyPrice">Цена за одну бумагу</label>
              <input
                id="buyPrice"
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                disabled={tradeLoading}
                required
              />

              <label htmlFor="buyCommission">Комиссия</label>
              <input
                id="buyCommission"
                type="number"
                min="0"
                step="0.01"
                value={commission}
                onChange={(event) => setCommission(event.target.value)}
                disabled={tradeLoading}
                required
              />

              <div className={styles.tradeTotal}>
                <span>Стоимость бумаг</span>
                <strong>{formatMoney(tradeAmount)}</strong>
              </div>

              <div className={styles.tradeTotal}>
                <span>Комиссия</span>
                <strong>{formatMoney(Number(commission) || 0)}</strong>
              </div>

              <div className={styles.finalTotal}>
                <span>Итого к оплате</span>
                <strong>{formatMoney(tradeTotal)}</strong>
              </div>

              {tradeError && <div className={styles.error}>{tradeError}</div>}

              <button
                type="submit"
                className={styles.buyButton}
                disabled={tradeLoading || !selectedSecurity || !selectedAccount}
              >
                {tradeLoading ? "Выполнение покупки..." : "Подтвердить покупку"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно продажи */}
      {tradeMode === "sell" && (
        <div
          className={styles.modalOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeTradeModal();
            }
          }}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sellModalTitle"
          >
            <button
              type="button"
              className={styles.closeButton}
              onClick={closeTradeModal}
              disabled={tradeLoading}
              aria-label="Закрыть"
            >
              ×
            </button>

            <div className={styles.modalHeader}>
              <span className={styles.sellIcon}>−</span>
              <div>
                <h2 id="sellModalTitle">Продажа ценных бумаг</h2>
                <p>Оформление заявки на продажу</p>
              </div>
            </div>

            <div className={styles.tradeAccount}>
              <span>Инвестиционный счёт</span>
              <strong>{selectedAccount?.name}</strong>
              <small>{selectedAccount?.accountNumber}</small>
            </div>

            <form onSubmit={handleTrade} className={styles.tradeForm}>
              <label htmlFor="sellSecurity">Ценная бумага</label>

              <select
                id="sellSecurity"
                value={selectedSecurityId}
                onChange={(event) => handleSecurityChange(event.target.value)}
                disabled={tradeLoading}
                required
              >
                {items.map((item) => (
                  <option key={item.idSecurity} value={item.idSecurity}>
                    {item.ticker} — {item.securityName}
                  </option>
                ))}
              </select>

              {selectedSecurity && (
                <div className={styles.availableQuantity}>
                  Доступно для продажи:{" "}
                  <strong>
                    {(selectedSecurity as PortfolioItem).quantity}
                  </strong>
                </div>
              )}

              <label htmlFor="sellQuantity">Количество</label>
              <input
                id="sellQuantity"
                type="number"
                min="1"
                max={
                  selectedSecurity
                    ? (selectedSecurity as PortfolioItem).quantity
                    : undefined
                }
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                disabled={tradeLoading}
                required
              />

              <label htmlFor="sellPrice">Цена за одну бумагу</label>
              <input
                id="sellPrice"
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                disabled={tradeLoading}
                required
              />

              <label htmlFor="sellCommission">Комиссия</label>
              <input
                id="sellCommission"
                type="number"
                min="0"
                step="0.01"
                value={commission}
                onChange={(event) => setCommission(event.target.value)}
                disabled={tradeLoading}
                required
              />

              <div className={styles.tradeTotal}>
                <span>Стоимость продажи</span>
                <strong>{formatMoney(tradeAmount)}</strong>
              </div>

              <div className={styles.tradeTotal}>
                <span>Комиссия</span>
                <strong>{formatMoney(Number(commission) || 0)}</strong>
              </div>

              <div className={styles.finalTotal}>
                <span>К получению</span>
                <strong>{formatMoney(tradeTotal)}</strong>
              </div>

              {tradeError && <div className={styles.error}>{tradeError}</div>}

              <button
                type="submit"
                className={styles.sellButton}
                disabled={tradeLoading || !selectedSecurity || !selectedAccount}
              >
                {tradeLoading ? "Выполнение продажи..." : "Подтвердить продажу"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно открытия счёта */}
      {isCreateAccountOpen && (
        <div
          className={styles.modalOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsCreateAccountOpen(false);
            }
          }}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="createAccountTitle"
          >
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setIsCreateAccountOpen(false)}
              aria-label="Закрыть"
            >
              ×
            </button>

            <h2 id="createAccountTitle" className={styles.modalTitle}>
              Открытие инвестиционного счёта
            </h2>

            <p>Здесь будет форма создания нового инвестиционного счёта.</p>

            <button
              type="button"
              className={styles.buyButton}
              onClick={() => setIsCreateAccountOpen(false)}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
