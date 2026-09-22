"use client";
import { useState } from "react";
import { toast } from "sonner";
import {
  api,
  currentMonth,
  expenseCategories,
  incomeCategories,
  today,
} from "@/lib/api";
import { Field, Modal, Spinner } from "@/components/ui";
export type Kind =
  "transactions" | "budgets" | "goals" | "debts" | "investments";
type Values = Record<string, string | number | boolean>;
type Props = {
  kind: Kind;
  initial?: Values;
  month?: string;
  onClose: () => void;
  onSaved: () => void;
};
const singular = {
  transactions: "transaction",
  budgets: "budget",
  goals: "goal",
  debts: "debt",
  investments: "investment",
};
export function RecordForm({ kind, initial, month, onClose, onSaved }: Props) {
  const [values, setValues] = useState<Values>({
    type:
      kind === "transactions"
        ? "Expense"
        : kind === "debts"
          ? "Personal Loan"
          : "Mutual Fund",
    category:
      kind === "goals"
        ? "Emergency Fund"
        : kind === "budgets"
          ? "Total"
          : "Food",
    date: today(),
    month: month || currentMonth(),
    payment_method: "UPI",
    recurring: false,
    current: 0,
    priority: "Medium",
    monthly: 0,
    rate: 0,
    ...initial,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function change(key: string, value: string | number | boolean) {
    setValues((old) => ({
      ...old,
      [key]: value,
      ...(kind === "transactions" && key === "type"
        ? { category: value === "Income" ? "Salary" : "Food" }
        : {}),
    }));
  }
  function input(key: string, label: string, type = "text", required = true) {
    return (
      <Field label={label} key={key}>
        <input
          type={type}
          value={String(values[key] ?? "")}
          onChange={(e) => change(key, e.target.value)}
          required={required}
          min={type === "number" ? 0 : undefined}
          step={type === "number" ? "0.01" : undefined}
          maxLength={type === "text" ? 200 : undefined}
        />
      </Field>
    );
  }
  function select(key: string, label: string, options: string[]) {
    return (
      <Field label={label}>
        <select
          value={String(values[key] ?? options[0])}
          onChange={(e) => change(key, e.target.value)}
        >
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </Field>
    );
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/records/${kind}${initial?.id ? "/" + initial.id : ""}`, {
        method: initial?.id ? "PATCH" : "POST",
        body: JSON.stringify(values),
      });
      toast.success(
        `${singular[kind][0].toUpperCase() + singular[kind].slice(1)} ${initial?.id ? "updated" : "added"} successfully.`,
      );
      onSaved();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={`${initial?.id ? "Edit" : "Add"} ${singular[kind]}`}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          {kind === "transactions" && (
            <>
              {select("type", "Transaction type", ["Income", "Expense"])}
              {input("amount", "Amount (₹)", "number")}
              {select(
                "category",
                "Category",
                values.type === "Income" ? incomeCategories : expenseCategories,
              )}
              {input("date", "Date", "date")}
              {input("description", "Description")}
              {select("payment_method", "Payment method", [
                "UPI",
                "Cash",
                "Debit Card",
                "Credit Card",
                "Bank Transfer",
                "Other",
              ])}
              <Field label="Repeats monthly">
                <input
                  type="checkbox"
                  checked={Boolean(values.recurring)}
                  onChange={(e) => change("recurring", e.target.checked)}
                />
              </Field>
            </>
          )}
          {kind === "budgets" && (
            <>
              {input("month", "Budget month", "month")}
              {select("category", "Category", ["Total", ...expenseCategories])}
              {input("amount", "Monthly limit (₹)", "number")}
            </>
          )}
          {kind === "goals" && (
            <>
              {input("name", "Goal name")}
              {select("category", "Category", [
                "Emergency Fund",
                "Education",
                "Travel",
                "Electronics",
                "Vehicle",
                "Home",
                "Retirement",
                "Other",
              ])}
              {input("target", "Target amount (₹)", "number")}
              {input("current", "Current savings (₹)", "number")}
              {input("target_date", "Target date", "date")}
              {select("priority", "Priority", ["High", "Medium", "Low"])}
            </>
          )}
          {kind === "debts" && (
            <>
              {input("name", "Debt name")}
              {select("type", "Debt type", [
                "Education Loan",
                "Personal Loan",
                "Credit Card",
                "Vehicle Loan",
                "Other",
              ])}
              {input("balance", "Outstanding principal (₹)", "number")}
              {input("rate", "Annual interest (%)", "number")}
              {input("payment", "Monthly EMI / minimum (₹)", "number")}
              {input("due_date", "Next due date", "date", false)}
            </>
          )}
          {kind === "investments" && (
            <>
              {input("name", "Investment name")}
              {select("type", "Investment type", [
                "Fixed Deposit",
                "Mutual Fund",
                "Equity",
                "Gold",
                "PPF",
                "EPF",
                "Bonds",
                "Other",
              ])}
              {input("amount", "Total invested (₹)", "number")}
              {input("monthly", "Monthly contribution (₹)", "number")}
            </>
          )}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? <Spinner /> : "Save " + singular[kind]}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function DeleteRecord({
  kind,
  id,
  onClose,
  onSaved,
}: {
  kind: Kind;
  id: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Modal title={`Delete ${singular[kind]}?`} onClose={onClose}>
      <p>
        This will permanently remove this record from your account and update
        related calculations.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="button" onClick={onClose}>
          Keep record
        </button>
        <button
          className="button danger"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await api(`/records/${kind}/${id}`, {
                method: "DELETE",
                body: "{}",
              });
              toast.success("Record deleted.");
              onSaved();
              onClose();
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? <Spinner /> : "Delete record"}
        </button>
      </div>
    </Modal>
  );
}
