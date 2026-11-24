"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import { reportApi } from "@/entities/report/api/reportApi";

import styles from "./Reports.module.scss";

type ReportType = "operations" | "incomes" | "freshness" | "commissions";

const tabs: { id: ReportType; label: string }[] = [
  { id: "operations", label: "Операции" },
  { id: "incomes", label: "Доходы" },
  { id: "freshness", label: "Актуальность данных" },
  { id: "commissions", label: "Комиссии" },
];

const reportTitles: Record<ReportType, string> = {
  operations: "История операций",
  incomes: "Доходы",
  freshness: "Актуальность рыночных данных",
  commissions: "Комиссии",
};

const reportLoaders = {
  operations: reportApi.getOperations,
  incomes: reportApi.getIncomes,
  freshness: reportApi.getFreshness,
  commissions: reportApi.getCommissions,
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function ReportTable({ data }: { data: unknown }) {
  if (data === null || data === undefined) {
    return <p>Данные отсутствуют</p>;
  }

  const rows = Array.isArray(data) ? data : [data];

  if (rows.length === 0) {
    return <p>Данные отсутствуют</p>;
  }

  if (
    rows.some(
      (item) =>
        item === null || typeof item !== "object" || Array.isArray(item),
    )
  ) {
    return (
      <div className={styles.reportValues}>
        {rows.map((item, index) => (
          <pre key={index}>{formatValue(item)}</pre>
        ))}
      </div>
    );
  }

  const columns = Array.from(
    new Set(
      rows.flatMap((item) => Object.keys(item as Record<string, unknown>)),
    ),
  );

  if (columns.length === 0) {
    return <p>Данные отсутствуют</p>;
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((item, index) => {
            const row = item as Record<string, unknown>;

            return (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column}>{formatValue(row[column])}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function Reports() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ReportType>("operations");

  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchReport = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/auth");
        return;
      }

      try {
        setLoading(true);
        setError("");
        setData(null);

        const result = await reportLoaders[activeTab](token);

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (cancelled) return;

        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("username");
            router.replace("/auth");
            return;
          }

          setError(err.response?.data?.message || "Не удалось загрузить отчёт");
        } else {
          setError("Произошла неизвестная ошибка");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchReport();

    return () => {
      cancelled = true;
    };
  }, [activeTab, router]);

  return (
    <section className={styles.reports}>
      <h1 className={styles.title}>Отчёты и аналитика</h1>

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? styles.activeTab : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.reportContent}>
        <h2>{reportTitles[activeTab]}</h2>

        {loading ? (
          <p className={styles.message}>Загрузка отчёта...</p>
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : (
          <ReportTable data={data} />
        )}
      </div>
    </section>
  );
}
