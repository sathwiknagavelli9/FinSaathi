"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Bell, Check, Send, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { User, Alert } from "@/lib/types";
import { useApp } from "@/components/app-shell";
import {
  Card,
  Field,
  Empty,
  Loading,
  ErrorState,
  Spinner,
  Modal,
} from "@/components/ui";
export function Alerts() {
  const { refreshAlerts } = useApp();
  const [rows, setRows] = useState<Alert[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    api<Alert[]>("/alerts")
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);
  async function action(id: string, type: string) {
    try {
      await api("/alerts/" + id, {
        method: "PATCH",
        body: JSON.stringify({ action: type }),
      });
      load();
      refreshAlerts();
      toast.success("Alerts updated.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} retry={load} />;
  return (
    <div className="stack">
      <div className="section-toolbar">
        <p>Timely reminders, grounded in your current financial records.</p>
        <button
          className="button"
          disabled={!rows.some((r) => !r.read)}
          onClick={() => action("all", "read")}
        >
          <Check size={16} />
          Mark all read
        </button>
      </div>
      {rows.length ? (
        rows.map((a) => (
          <Card key={a.id}>
            <div className={`alert-card ${a.read ? "read" : ""}`}>
              <Bell size={21} />
              <div>
                <div className="spread">
                  <h3>{a.title}</h3>
                  <span className={`badge ${a.severity.toLowerCase()}`}>
                    {a.severity}
                  </span>
                </div>
                <p>{a.message}</p>
              </div>
              <div className="table-actions">
                {!a.read && (
                  <button
                    className="icon-button"
                    aria-label={"Mark read: " + a.title}
                    onClick={() => action(a.id, "read")}
                  >
                    <Check size={15} />
                  </button>
                )}
                <button
                  className="icon-button"
                  aria-label={"Dismiss: " + a.title}
                  onClick={() => action(a.id, "dismiss")}
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          </Card>
        ))
      ) : (
        <Card>
          <Empty
            title="You’re all caught up"
            text="Alerts appear when your recorded budgets, debts, goals or cash flow need attention."
          />
        </Card>
      )}
    </div>
  );
}
type Chat = { message: string; reply: string };
export function Assistant() {
  const [history, setHistory] = useState<Chat[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    api<Chat[]>("/assistant")
      .then(setHistory)
      .catch((e) => setError(e.message));
  }, []);
  const prompts = [
    "Where did most of my money go this month?",
    "How is my budget doing?",
    "How much should I save for my goal each month?",
    "Which expense category increased the most?",
    "How is my financial health?",
    "Summarize my finances this month.",
    "What should I focus on financially?",
  ];
  async function send(value: string) {
    if (!value.trim() || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await api<{ reply: string; available: boolean }>(
        "/assistant",
        { method: "POST", body: JSON.stringify({ message: value }) },
      );
      setHistory((h) => [...h, { message: value, reply: result.reply }]);
    } catch (e) {
      setError((e as Error).message);
      setMessage(value);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="chat">
      <div className="chat-intro">
        <span className="empty-icon">
          <Sparkles size={25} />
        </span>
        <h2>A little clarity, just a question away.</h2>
        <p>
          Hi! I’m FinSaathi AI. I can help you understand your spending,
          budgets, goals and financial progress.
        </p>
      </div>
      {!history.length && (
        <div className="suggested-prompts">
          {prompts.map((p) => (
            <button key={p} disabled={busy} onClick={() => send(p)}>
              {p} ↗
            </button>
          ))}
        </div>
      )}
      <div className="chat-messages" aria-live="polite">
        {history.map((h, i) => (
          <div className="stack" key={i}>
            <div className="chat-bubble user">
              <strong>You</strong>
              {h.message}
            </div>
            <div className="chat-bubble">
              <strong>FinSaathi AI</strong>
              {h.reply}
            </div>
          </div>
        ))}
        {busy && (
          <div className="chat-bubble">
            <Spinner /> Reviewing your financial picture…
          </div>
        )}
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <form
        className="chat-compose"
        onSubmit={(e) => {
          e.preventDefault();
          send(message);
        }}
      >
        <textarea
          aria-label="Message FinSaathi AI"
          placeholder="Ask about your money…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={1500}
          required
        />
        <button
          className="button primary"
          disabled={busy || !message.trim()}
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </form>
      <p className="chat-disclaimer">
        AI can make mistakes. Educational guidance, not professional advice.
        Uses your current-month summary.{" "}
        <Link href="/privacy">How your data is used</Link>
      </p>
    </div>
  );
}
export function Settings() {
  const { user, setUser, refreshAlerts } = useApp();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const form = e.currentTarget;
    try {
      const updated = await api<User>("/profile", {
        method: "PATCH",
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      setUser(updated);
      toast.success("Profile updated.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function dataAction() {
    setBusy(true);
    setError("");
    try {
      const path = confirm === "reset" ? "/financial-data" : "/demo-data";
      const result = await api<{ message: string }>(path, {
        method: confirm === "load" ? "POST" : "DELETE",
        body: JSON.stringify({ confirmation: confirmText }),
      });
      toast.success(result.message);
      setConfirm(null);
      refreshAlerts();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const numberFields = [
    ["monthly_income", "Monthly income estimate (₹)"],
    ["monthly_expenses", "Monthly expense estimate (₹)"],
    ["savings", "Current savings (₹)"],
    ["emergency_fund", "Emergency fund (₹)"],
    ["current_investments", "Starting investments estimate (₹)"],
    ["investment_capacity", "Monthly investment capacity (₹)"],
    ["investment_horizon", "Investment horizon (years)"],
  ] as const;
  return (
    <div className="stack">
      <Card>
        <div className="settings-section">
          <div>
            <h2>Your profile</h2>
            <p>Your starting picture and preferences.</p>
          </div>
          <form onSubmit={save}>
            <div className="form-grid">
              <Field label="Full name">
                <input
                  name="name"
                  required
                  defaultValue={user.name}
                  maxLength={100}
                />
              </Field>
              <Field label="Email address">
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={user.email}
                />
              </Field>
              <Field label="Occupation">
                <select
                  name="occupation"
                  defaultValue={user.occupation || "Other"}
                >
                  {[
                    "Student",
                    "Salaried Employee",
                    "Self-employed",
                    "Business",
                    "Other",
                  ].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Age range">
                <select
                  name="age_range"
                  defaultValue={user.age_range || "18–24"}
                >
                  {["Under 18", "18–24", "25–34", "35–44", "45–54", "55+"].map(
                    (o) => (
                      <option key={o}>{o}</option>
                    ),
                  )}
                </select>
              </Field>
              <Field label="Currency">
                <select name="currency" defaultValue="INR">
                  <option value="INR">INR · Indian Rupee</option>
                </select>
              </Field>
              <Field label="Risk tolerance">
                <select name="risk" defaultValue={user.risk || "Moderate"}>
                  {["Conservative", "Moderate", "Aggressive"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              {numberFields.map(([key, label]) => (
                <Field label={label} key={key}>
                  <input
                    name={key}
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    defaultValue={user[key] ?? 0}
                  />
                </Field>
              ))}
            </div>
            <p className="small muted">
              Estimates are profile context; cash-flow analytics use recorded
              transactions. Manage onboarding debts and goals in{" "}
              <Link className="text-link" href="/app/debts">
                Debt Escape
              </Link>{" "}
              and{" "}
              <Link className="text-link" href="/app/goals">
                Goals
              </Link>
              .
            </p>
            <div>
              <button className="button primary" disabled={busy}>
                Save profile
              </button>
            </div>
          </form>
        </div>
      </Card>
      <Card>
        <div className="settings-section">
          <div>
            <h2>Appearance</h2>
            <p>Choose the space that feels right.</p>
          </div>
          <Field label="Color theme">
            <select
              value={theme || "system"}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">Follow system</option>
            </select>
          </Field>
        </div>
      </Card>
      <Card>
        <div className="settings-section">
          <div>
            <h2>Security</h2>
            <p>Use a unique password for your account.</p>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const values = Object.fromEntries(new FormData(form));
              if (values.password !== values.confirm) {
                toast.error("Passwords must match.");
                return;
              }
              setBusy(true);
              try {
                await api("/auth/password", {
                  method: "POST",
                  body: JSON.stringify(values),
                });
                form.reset();
                toast.success(
                  "Password changed. Other sessions were signed out.",
                );
              } catch (err) {
                toast.error((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field label="Current password">
              <input
                type="password"
                name="current_password"
                required
                autoComplete="current-password"
              />
            </Field>
            <div className="form-grid">
              <Field
                label="New password"
                hint="10–128 characters, with a letter and a number."
              >
                <input
                  type="password"
                  name="password"
                  minLength={10}
                  maxLength={128}
                  required
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Confirm new password">
                <input
                  type="password"
                  name="confirm"
                  minLength={10}
                  required
                  autoComplete="new-password"
                />
              </Field>
            </div>
            <div>
              <button className="button" disabled={busy}>
                Change password
              </button>
            </div>
          </form>
        </div>
      </Card>
      <Card>
        <div className="settings-section">
          <div>
            <h2>Your data</h2>
            <p>Demo records are fictional and optional.</p>
          </div>
          <div className="stack">
            <p className="small">
              Load several months of fictional data into an empty workspace for
              a demonstration. Your profile values are preserved.
            </p>
            <div className="filters">
              <button
                className="button"
                onClick={() => {
                  setConfirm("load");
                  setError("");
                }}
              >
                Load demo data
              </button>
              <button
                className="button"
                onClick={() => {
                  setConfirm("remove");
                  setError("");
                }}
              >
                Remove demo data
              </button>
              <button
                className="button danger"
                onClick={() => {
                  setConfirm("reset");
                  setError("");
                  setConfirmText("");
                }}
              >
                Clear financial records
              </button>
            </div>
            <a
              className="text-link"
              href="/api/records/transactions?export=csv"
            >
              Export all transactions as CSV ↗
            </a>
          </div>
        </div>
      </Card>
      <Card>
        <div className="spread">
          <div>
            <h2>Account</h2>
            <p className="small">Sign out of your FinSaathi account.</p>
          </div>
          <button
            className="button"
            onClick={async () => {
              try {
                await api("/auth/logout", { method: "POST", body: "{}" });
                router.replace("/login");
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
          >
            Log out
          </button>
        </div>
      </Card>
      {confirm && (
        <Modal
          title={
            confirm === "load"
              ? "Load fictional demo data?"
              : confirm === "reset"
                ? "Clear all financial records?"
                : "Remove demo records?"
          }
          onClose={() => setConfirm(null)}
        >
          <p>
            {confirm === "load"
              ? "This adds fictional transactions, budgets, goals, debts and investments to your empty workspace."
              : confirm === "reset"
                ? "This permanently removes all financial records and chat history in your account. Your account and profile are preserved."
                : "This removes records marked as demo, including any edits to those records. Your other financial records remain."}
          </p>
          {confirm === "reset" && (
            <Field label="Type RESET to confirm">
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
              />
            </Field>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button className="button" onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button
              className={
                "button " + (confirm === "load" ? "primary" : "danger")
              }
              disabled={
                busy || (confirm === "reset" && confirmText !== "RESET")
              }
              onClick={dataAction}
            >
              {busy ? <Spinner /> : "Confirm"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
