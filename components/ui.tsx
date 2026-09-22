"use client";
import { useEffect, useRef } from "react";
import { ArrowUpRight, X, WalletCards, Plus, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { money } from "@/lib/api";
export function Logo() {
  return (
    <Link className="logo" href="/">
      <span className="logo-mark">
        <WalletCards size={22} />
      </span>
      Fin<span>Saathi</span>
    </Link>
  );
}
export function Spinner() {
  return <LoaderCircle className="spin" size={18} aria-label="Loading" />;
}
export function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading financial information"
      className="loading-stack"
    >
      <div className="skeleton" style={{ height: 80 }} />
      <div className="kpi-grid">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 140 }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 300 }} />
    </div>
  );
}
export function Empty({
  title = "No records yet",
  text = "Add your first record to start building a clearer financial picture.",
  onAdd,
}: {
  title?: string;
  text?: string;
  onAdd?: () => void;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <WalletCards size={28} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {onAdd && (
        <button className="button primary" onClick={onAdd}>
          <Plus size={16} />
          Add your first record
        </button>
      )}
    </div>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="error-box" role="alert">
      <strong>Something needs attention</strong>
      <p>{message}</p>
      {retry && (
        <button className="button" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
export function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <div className="card-heading">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Kpi({
  label,
  value,
  detail,
  icon,
  accent = false,
}: {
  label: string;
  value: string;
  detail?: string;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`kpi ${accent ? "accent" : ""}`}>
      <div className="kpi-label">
        {label}
        <span>{icon || <ArrowUpRight size={18} />}</span>
      </div>
      <strong>{value}</strong>
      <p>{detail || "Based on your recorded activity"}</p>
    </div>
  );
}
export function Progress({
  value,
  tone = "",
}: {
  value: number;
  tone?: string;
}) {
  return (
    <div
      className={`progress ${tone}`}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
export function BudgetRows({
  rows,
}: {
  rows: {
    id: string;
    category: string;
    spent: number;
    amount: number;
    utilization: number;
  }[];
}) {
  return (
    <div className="rows">
      {rows.map((b) => (
        <div key={b.id}>
          <div className="spread">
            <strong>{b.category}</strong>
            <span>
              {money(b.spent)} <small>/ {money(b.amount)}</small>
            </span>
          </div>
          <Progress
            value={b.utilization}
            tone={
              b.utilization > 100
                ? "danger"
                : b.utilization >= 80
                  ? "warning"
                  : ""
            }
          />
          <div className="spread muted small">
            <span>
              {b.utilization > 100
                ? "Exceeded"
                : b.utilization >= 80
                  ? "Approaching limit"
                  : "Safe"}
            </span>
            <span>{b.utilization.toFixed(0)}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = ref.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  return (
    <dialog ref={ref} className="modal" onCancel={onClose}>
      <div className="modal-title">
        <h2>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
