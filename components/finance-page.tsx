"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { useApp, navigation } from "@/components/app-shell";
import {
  Dashboard,
  Analyzer,
  Prediction,
  Planning,
  Health,
  Reports,
} from "@/components/finance-views";
import { Transactions } from "@/components/transactions";
import { Alerts, Assistant, Settings } from "@/components/secondary-views";
import { RecordForm } from "@/components/record-form";
import { Loading, ErrorState, Field, Card } from "@/components/ui";
import { api, money, percent } from "@/lib/api";
import type { Summary } from "@/lib/types";
export function FinancePage({ slug }: { slug: string }) {
  const { user, month, refreshAlerts } = useApp();
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [add, setAdd] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [range, setRange] = useState("");
  const independent = [
    "transactions",
    "alerts",
    "assistant",
    "settings",
  ].includes(slug);
  const load = useCallback(() => {
    if (independent) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    api<Summary>(
      "/dashboard?month=" + month + (slug === "reports" ? range : ""),
    )
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [month, independent, slug, range]);
  useEffect(load, [load]);
  function reload() {
    load();
    refreshAlerts();
  }
  const hour = new Date().getHours();
  const title =
    slug === "dashboard"
      ? `Good ${hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"}, ${user.name.split(" ")[0]}`
      : navigation.find((n) => n[0] === slug)?.[1] || "Your finances";
  const subtitle =
    slug === "dashboard"
      ? data && data.income > 0
        ? `${money(data.net)} net cash flow · ${percent(data.savings_rate)} savings rate for the selected month.`
        : "A little clarity for today. A little confidence for tomorrow."
      : "Your money, understood. Your next step, informed.";
  return (
    <>
      <div className="page-heading">
        <div>
          {slug === "dashboard" && (
            <span className="eyebrow">LET’S MAKE THIS MONTH COUNT</span>
          )}
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {slug === "dashboard" && (
          <button className="button primary" onClick={() => setAdd(true)}>
            <Plus size={16} />
            Add transaction
          </button>
        )}
      </div>
      {slug === "reports" && (
        <Card className="no-print">
          <form
            className="filters"
            onSubmit={(e) => {
              e.preventDefault();
              setRange(start && end ? `&start=${start}&end=${end}` : "");
            }}
          >
            <Field label="Custom range start">
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </Field>
            <Field label="Custom range end">
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </Field>
            <button className="button">Apply range</button>
            <button
              type="button"
              className="button"
              onClick={() => {
                setStart("");
                setEnd("");
                setRange("");
              }}
            >
              Use selected month
            </button>
          </form>
        </Card>
      )}
      <div style={slug === "reports" ? { marginTop: 22 } : undefined}>
        {independent ? (
          slug === "transactions" ? (
            <Transactions />
          ) : slug === "alerts" ? (
            <Alerts />
          ) : slug === "assistant" ? (
            <Assistant />
          ) : (
            <Settings />
          )
        ) : error ? (
          <ErrorState message={error} retry={load} />
        ) : loading || !data ? (
          <Loading />
        ) : slug === "dashboard" ? (
          <Dashboard data={data} />
        ) : slug === "analyzer" ? (
          <Analyzer data={data} />
        ) : slug === "prediction" ? (
          <Prediction data={data} />
        ) : slug === "health" ? (
          <Health data={data} />
        ) : slug === "reports" ? (
          <Reports data={data} />
        ) : (
          <Planning
            kind={slug as "budgets" | "goals" | "debts" | "investments"}
            data={data}
            reload={reload}
          />
        )}
      </div>
      {add && (
        <RecordForm
          kind="transactions"
          onClose={() => setAdd(false)}
          onSaved={reload}
        />
      )}
    </>
  );
}
