"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Target,
  Sparkles,
  Pencil,
  Trash2,
  Plus,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/app-shell";
import {
  Card,
  Kpi,
  Empty,
  Progress,
  BudgetRows,
  Modal,
  Field,
  Spinner,
} from "@/components/ui";
import { CashChart, Donut, Bars, ScoreChart } from "@/components/charts";
import { api, money, percent } from "@/lib/api";
import type { Summary, Goal, Debt, Investment, Budget } from "@/lib/types";
import { RecordForm, DeleteRecord, type Kind } from "@/components/record-form";
type Editable = Goal | Debt | Investment | Budget;
export function SummaryKpis({ data }: { data: Summary }) {
  return (
    <div className="kpi-grid">
      <Kpi
        label="Monthly income"
        value={money(data.income)}
        icon={<ArrowDownLeft size={18} />}
        detail={
          data.income_change === null
            ? "Add prior income to see a trend"
            : `${percent(data.income_change)} vs previous full month`
        }
      />
      <Kpi
        label="Monthly expenses"
        value={money(data.expenses)}
        icon={<ArrowUpRight size={18} />}
        detail={
          data.expense_change === null
            ? "Every expense, in one picture"
            : `${percent(data.expense_change)} vs previous full month`
        }
      />
      <Kpi
        label="Net savings"
        value={money(data.net)}
        icon={<Wallet size={18} />}
        detail={
          data.savings_rate === null
            ? "Record income to see savings rate"
            : `${percent(data.savings_rate)} of recorded income`
        }
        accent
      />
      <Kpi
        label="Remaining budget"
        value={money(data.remaining_budget)}
        icon={<Target size={18} />}
        detail={
          data.total_budget
            ? `${money(data.total_budget)} total monthly limit`
            : "Set a budget to give spending a plan"
        }
      />
    </div>
  );
}
export function ScoreRing({ score }: { score: number | null }) {
  return (
    <div
      className="score-ring"
      style={{ "--score": `${(score || 0) * 3.6}deg` } as React.CSSProperties}
    >
      <div>
        <strong>{score ?? "—"}</strong>
        <small>OUT OF 100</small>
      </div>
    </div>
  );
}
export function Dashboard({ data }: { data: Summary }) {
  const active = data.goals.filter((g) => !g.completed).slice(0, 3);
  return (
    <div className="stack">
      <SummaryKpis data={data} />
      <div className="dashboard-grid">
        <Card
          title="Cash flow"
          subtitle="A wider view of your income and spending"
          action={<span className="badge">Last 6 months</span>}
        >
          {data.history.some((h) => h.income || h.expenses) ? (
            <>
              <CashChart data={data.history} />
              <p className="small muted">
                Selected month: {money(data.income)} income ·{" "}
                {money(data.expenses)} expenses
              </p>
            </>
          ) : (
            <Empty
              title="Your story starts here"
              text="Add income and expenses to see your cash flow."
            />
          )}
        </Card>
        <Card
          title="Where your money went"
          subtitle="Expense breakdown for the selected month"
        >
          {data.categories.length ? (
            <Donut data={data.categories} />
          ) : (
            <Empty
              title="No expenses yet"
              text="Your category breakdown will appear here."
            />
          )}
        </Card>
      </div>
      <div className="dashboard-grid">
        <Card
          title="Your budgets, on track"
          subtitle="Small boundaries. More breathing room."
          action={<Link href="/app/budgets">View budgets ↗</Link>}
        >
          {data.budgets.length ? (
            <BudgetRows rows={data.budgets.slice(0, 4)} />
          ) : (
            <Empty
              title="Give your month a plan"
              text="Set total and category budgets to follow your progress."
            />
          )}
        </Card>
        <Card
          title="Financial health"
          subtitle="A little check-in with your financial habits"
          action={<Link href="/app/health">See details ↗</Link>}
        >
          <div className="health-overview">
            <ScoreRing score={data.health.score} />
            <div>
              <span className="badge">{data.health.status}</span>
              <p>
                {data.health.recommendations[0] ||
                  "Keep reviewing your plan as your priorities change."}
              </p>
            </div>
          </div>
          <p className="small muted" style={{ marginTop: 20 }}>
            Calculated from your records. Not a credit score.
          </p>
        </Card>
      </div>
      <div className="insight-strip">
        <Sparkles size={22} />
        <div>
          <strong>A little insight for your next step</strong>
          <p>
            {data.insights[0] ||
              "Add your first transactions to unlock insights grounded in your own financial activity."}
          </p>
        </div>
      </div>
      <div className="two-grid">
        <Card
          title="Making room for your goals"
          subtitle="Big plans, one step at a time"
          action={<Link href="/app/goals">All goals ↗</Link>}
        >
          {active.length ? (
            <div className="rows">
              {active.map((g) => (
                <div key={g.id}>
                  <div className="spread">
                    <strong>{g.name}</strong>
                    <span>{g.progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={g.progress} />
                  <div className="spread small muted">
                    <span>
                      {money(g.current)} of {money(g.target)}
                    </span>
                    <span>{money(g.required_monthly)}/mo</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title="What’s your next chapter?"
              text="Create a goal and make a monthly plan to get there."
            />
          )}
        </Card>
        <Card
          title="Upcoming obligations"
          subtitle="Keep the next steps in view"
        >
          {data.debts.length ||
          active.length ||
          data.recurring_obligations.length ? (
            <div className="rows">
              {data.debts.slice(0, 3).map((d) => (
                <div className="spread" key={d.id}>
                  <div>
                    <strong>{d.name}</strong>
                    <p className="small">
                      {d.due_date || "Monthly debt payment"}
                    </p>
                  </div>
                  <strong>{money(d.payment)}</strong>
                </div>
              ))}
              {active.slice(0, 2).map((g) => (
                <div className="spread" key={g.id}>
                  <div>
                    <strong>{g.name}</strong>
                    <p className="small">Suggested monthly contribution</p>
                  </div>
                  <strong>{money(g.required_monthly)}</strong>
                </div>
              ))}
              {data.recurring_obligations.slice(0, 3).map((item) => (
                <div className="spread" key={item.category + item.name}>
                  <div>
                    <strong>{item.name}</strong>
                    <p className="small">
                      Estimated monthly recurrence · {item.due_date}
                    </p>
                  </div>
                  <strong>{money(item.amount)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title="Nothing upcoming yet"
              text="Debts, recurring expenses and goal contributions will be shown here."
            />
          )}
        </Card>
      </div>
      <Card
        title="Recent transactions"
        action={<Link href="/app/transactions">View all ↗</Link>}
      >
        {data.recent.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((t) => (
                  <tr key={t.id}>
                    <td className="description">{t.description}</td>
                    <td>{t.category}</td>
                    <td>{t.date}</td>
                    <td className={t.type === "Income" ? "teal" : ""}>
                      {t.type === "Income" ? "+" : "−"}
                      {money(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No transactions yet"
            text="Add your first transaction to start seeing financial insights."
          />
        )}
      </Card>
    </div>
  );
}
export function Analyzer({ data }: { data: Summary }) {
  return (
    <div className="stack">
      <div className="kpi-grid">
        <Kpi label="Total expenses" value={money(data.expenses)} />
        <Kpi label="Average per day" value={money(data.average_daily)} />
        <Kpi
          label="Top category"
          value={data.categories[0]?.name || "—"}
          detail={
            data.categories[0]
              ? `${percent(data.categories[0].share)} of total expenses`
              : "No expenses recorded"
          }
        />
        <Kpi
          label="Month-over-month"
          value={percent(data.expense_change)}
          detail={data.pattern}
        />
      </div>
      <div className="two-grid">
        <Card title="Spending by category">
          {data.categories.length ? (
            <Donut data={data.categories} />
          ) : (
            <Empty />
          )}
        </Card>
        <Card title="Monthly spending trend">
          <CashChart data={data.history} />
          <p className="small muted">
            Pattern: {data.pattern}. Partial months are not directly comparable
            to full months.
          </p>
        </Card>
        <Card title="Weekly spending">
          <Bars data={data.weekly} />
          <p className="small muted">
            {data.weekly
              .map((v) => `${v.name}: ${money(v.amount)}`)
              .join(" · ") || "No spending recorded."}
          </p>
        </Card>
        <Card title="Weekday and weekend totals">
          <Bars data={data.day_type} />
          <p className="small muted">
            {data.day_type
              .map((v) => `${v.name}: ${money(v.amount)}`)
              .join(" · ")}
            . Totals are not adjusted for the number of days.
          </p>
        </Card>
      </div>
      <Card title="What your records tell us">
        <ul className="insights-list">
          {(data.insights.length
            ? data.insights
            : ["Add financial history to reveal your spending patterns."]
          ).map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
export function Prediction({ data }: { data: Summary }) {
  const p = data.prediction;
  return (
    <div className="stack">
      <div className="kpi-grid">
        <Kpi
          label={`Estimated · ${p.month}`}
          value={money(p.prediction)}
          accent
          detail="Next-month expense estimate"
        />
        <Kpi label="Current month expenses" value={money(data.expenses)} />
        <Kpi
          label="Estimated change"
          value={
            p.prediction !== null && data.expenses > 0
              ? percent(((p.prediction - data.expenses) / data.expenses) * 100)
              : "—"
          }
          detail="Against recorded current-month expenses"
        />
        <Kpi
          label="Historical months"
          value={String(p.history.length)}
          detail={
            p.adequate
              ? "Enough history to fit a trend"
              : "Baseline / insufficient history"
          }
        />
      </div>
      <Card
        title={p.method}
        subtitle={
          p.adequate
            ? "Explainable statistical prediction"
            : "More history will improve this estimate"
        }
      >
        <p>{p.explanation}</p>
        {p.history.length ? (
          <>
            <CashChart
              data={[
                ...p.history,
                ...(p.prediction === null
                  ? []
                  : [
                      {
                        month: p.month + " (estimate)",
                        expenses: p.prediction,
                      },
                    ]),
              ]}
            />
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Historical expenses</th>
                  </tr>
                </thead>
                <tbody>
                  {p.history.map((h) => (
                    <tr key={h.month}>
                      <td>{h.month}</td>
                      <td>{money(h.expenses)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <Empty
            title="A little more history is needed"
            text="Record expenses in completed months to establish a useful baseline."
          />
        )}
      </Card>
      {p.categories.length > 0 && (
        <Card
          title="Category estimates"
          subtitle="Independently estimated; category rounding and nonnegative bounds can differ from the total."
        >
          <div className="three-grid">
            {p.categories.map((c) => (
              <div key={c.name}>
                <span className="muted">{c.name}</span>
                <h3>{money(c.amount)}</h3>
              </div>
            ))}
          </div>
        </Card>
      )}
      <p className="notice">
        Forecasts describe a possible trend. They do not account for unrecorded
        expenses, major life changes, or guaranteed future outcomes.
      </p>
    </div>
  );
}
export function Health({ data }: { data: Summary }) {
  return (
    <div className="stack">
      <Card title="Your financial health, explained">
        <div className="health-overview">
          <ScoreRing score={data.health.score} />
          <div>
            <h2>{data.health.status}</h2>
            <p>{data.health.explanation}</p>
          </div>
        </div>
      </Card>
      <div className="two-grid">
        <Card
          title="What goes into your score"
          subtitle="Only applicable factors are included and reweighted"
        >
          {data.health.factors.length ? (
            <div className="rows">
              {data.health.factors.map((f) => (
                <div key={f.name}>
                  <div className="spread">
                    <strong>{f.name}</strong>
                    <span>
                      {f.points.toFixed(1)} / {f.maximum.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={(f.points / f.maximum) * 100} />
                  <p className="small">{f.formula}</p>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="Build your starting picture" />
          )}
        </Card>
        <Card title="Your next practical steps">
          <ul className="insights-list">
            {(data.health.recommendations.length
              ? data.health.recommendations
              : ["Keep maintaining your habits and reviewing your goals."]
            ).map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Card>
      </div>
      <Card
        title="Health over time"
        subtitle="Monthly snapshots begin when you review your current-month finances"
      >
        {data.health_history.length > 1 ? (
          <>
            <ScoreChart data={data.health_history} />
            <p className="small muted">
              {data.health_history
                .map((h) => `${h.month}: ${h.score}/100`)
                .join(" · ")}
            </p>
          </>
        ) : (
          <Empty
            title="Your trend is just beginning"
            text="Return in future months to build a history of your score."
          />
        )}
      </Card>
    </div>
  );
}
export function Planning({
  kind,
  data,
  reload,
}: {
  kind: Exclude<Kind, "transactions">;
  data: Summary;
  reload: () => void;
}) {
  const { month, user } = useApp();
  const [editing, setEditing] = useState<Editable | "new" | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [contributing, setContributing] = useState<Goal | null>(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const rows = data[kind];
  async function contribution(e: React.FormEvent) {
    e.preventDefault();
    if (!contributing) return;
    setBusy(true);
    setError("");
    try {
      await api(`/goals/${contributing.id}/contribute`, {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
      toast.success("Contribution added.");
      setContributing(null);
      reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function controls(r: Editable) {
    return (
      <div className="record-actions">
        <button className="button small" onClick={() => setEditing(r)}>
          <Pencil size={13} />
          Edit
        </button>
        <button
          className="icon-button"
          aria-label={`Delete ${"name" in r ? r.name : r.category}`}
          onClick={() => setDeleting(r.id)}
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  }
  function goalCard(g: Goal) {
    return (
      <Card key={g.id}>
        <div className="record-card">
          <div className="record-top">
            <span className="badge">{g.category}</span>
            <span className="small muted">{g.priority} priority</span>
          </div>
          <h3>{g.name}</h3>
          <div>
            <div className="spread">
              <strong>{money(g.current)}</strong>
              <small className="muted">of {money(g.target)}</small>
            </div>
            <Progress value={g.progress} />
            <p>{g.progress.toFixed(0)}% saved</p>
          </div>
          <div className="record-meta">
            <div>
              <span>Target date</span>
              {g.target_date}
            </div>
            <div>
              <span>Required per month</span>
              {money(g.required_monthly)}
            </div>
          </div>
          {g.overdue && (
            <p className="danger-text">Target date passed. Review your plan.</p>
          )}
          {!g.completed && (
            <button
              className="button primary small"
              onClick={() => {
                setContributing(g);
                setAmount("");
                setError("");
              }}
            >
              Add contribution
            </button>
          )}
          {!g.completed && (
            <button
              className="button small"
              onClick={() => {
                setContributing(g);
                setAmount(String(g.remaining));
                setError("");
              }}
            >
              Mark completed
            </button>
          )}
          {controls(g)}
        </div>
      </Card>
    );
  }
  return (
    <div className="stack">
      <div className="section-toolbar">
        <p>
          {kind === "budgets"
            ? "Your limits. Your priorities. Your plan."
            : kind === "goals"
              ? "Make room for the things that matter."
              : kind === "debts"
                ? "A practical path toward less debt."
                : "A clear view of your investment allocation."}
        </p>
        <div className="filters">
          {kind === "budgets" && (
            <button
              className="button"
              onClick={async () => {
                try {
                  const r = await api<{ message: string }>("/budgets/copy", {
                    method: "POST",
                    body: JSON.stringify({ month }),
                  });
                  toast.success(r.message);
                  reload();
                } catch (err) {
                  toast.error((err as Error).message);
                }
              }}
            >
              Copy previous month
            </button>
          )}
          <button className="button primary" onClick={() => setEditing("new")}>
            <Plus size={16} />
            Add{" "}
            {kind === "budgets"
              ? "budget"
              : kind === "goals"
                ? "goal"
                : kind === "debts"
                  ? "debt"
                  : "investment"}
          </button>
        </div>
      </div>
      {kind === "budgets" && (
        <>
          <div className="three-grid">
            <Kpi label="Total budget" value={money(data.total_budget)} />
            <Kpi label="Total spent" value={money(data.expenses)} />
            <Kpi label="Remaining" value={money(data.remaining_budget)} />
          </div>
          <div className="two-grid">
            {data.budgets.map((b) => (
              <Card key={b.id}>
                <BudgetRows rows={[b]} />
                {controls(b)}
              </Card>
            ))}
          </div>
          {data.budget_suggestions.length > 0 && (
            <Card
              title="A starting point from your history"
              subtitle="Suggestions do not replace your chosen limits"
            >
              <div className="rows">
                {data.budget_suggestions.map((b) => (
                  <p key={b.category} className="small">
                    Your average {b.category.toLowerCase()} spending across{" "}
                    {b.months} recorded months in the previous three months was{" "}
                    <strong>{money(b.amount)}</strong>. Consider this when
                    choosing a realistic limit.
                  </p>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
      {kind === "goals" && (
        <>
          <div className="three-grid">
            {data.goals.filter((g) => !g.completed).map(goalCard)}
          </div>
          {data.goals.some((g) => g.completed) && (
            <>
              <h2>Completed goals</h2>
              <div className="three-grid">
                {data.goals.filter((g) => g.completed).map(goalCard)}
              </div>
            </>
          )}
        </>
      )}
      {kind === "debts" && (
        <>
          <div className="kpi-grid">
            <Kpi label="Outstanding debt" value={money(data.debt_total)} />
            <Kpi label="Monthly payments" value={money(data.debt_payments)} />
            <Kpi
              label="Debt-to-income"
              value={percent(data.debt_to_income)}
              detail="Monthly payments / recorded income"
            />
            <Kpi
              label="Highest annual rate"
              value={
                data.debts.length
                  ? `${Math.max(...data.debts.map((d) => d.rate))}%`
                  : "—"
              }
            />
          </div>
          <DebtSimulator />
          <div className="three-grid">
            {data.debts.map((d) => (
              <Card key={d.id}>
                <div className="record-card">
                  <span className="badge">{d.type}</span>
                  <h3>{d.name}</h3>
                  <div className="record-value">{money(d.balance)}</div>
                  <div className="record-meta">
                    <div>
                      <span>Annual interest</span>
                      {d.rate}%
                    </div>
                    <div>
                      <span>Monthly payment</span>
                      {money(d.payment)}
                    </div>
                    <div>
                      <span>Next due date</span>
                      {d.due_date || "Not set"}
                    </div>
                  </div>
                  {controls(d)}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
      {kind === "investments" && (
        <>
          <p className="notice">
            FinSaathi provides educational financial insights and does not
            provide professional investment advice.
          </p>
          <div className="three-grid">
            <Kpi label="Total invested" value={money(data.invested)} />
            <Kpi
              label="Monthly contributions"
              value={money(data.investing_monthly)}
            />
            <Kpi
              label="Your risk preference"
              value={user.risk || "Not set"}
              detail={`${user.investment_horizon ?? 0}-year stated horizon`}
            />
          </div>
          {data.investments.length > 0 && (
            <div className="two-grid">
              <Card title="Current allocation">
                <Donut
                  data={Object.entries(
                    data.investments.reduce(
                      (acc, i) => ({
                        ...acc,
                        [i.type]: (acc[i.type] || 0) + i.amount,
                      }),
                      {} as Record<string, number>,
                    ),
                  ).map(([name, amount]) => ({ name, amount }))}
                />
              </Card>
              <Card title="Considerations for your plan">
                <ul className="insights-list">
                  <li>
                    {user.risk === "Conservative"
                      ? "Your conservative preference suggests emphasizing liquidity and capital preservation when comparing options."
                      : user.risk === "Aggressive"
                        ? "Your aggressive preference accepts higher volatility. Ensure you can tolerate losses without affecting essential goals."
                        : "Your moderate preference suggests balancing growth exposure with more stable assets."}
                  </li>
                  <li>
                    {(user.investment_horizon || 0) < 3
                      ? "Your horizon is short. Review liquidity and the risk of needing to sell during a market downturn."
                      : "A longer horizon can provide more time to absorb fluctuations, but does not remove investment risk."}
                  </li>
                  <li>
                    {data.net > 0
                      ? `Recorded net cash flow is ${money(data.net)}. Compare it with your ${money(user.investment_capacity || 0)} stated investment capacity, debt payments and near-term goals.`
                      : "Review cash flow and emergency reserves before committing to additional investments."}
                  </li>
                  <li>
                    {data.investments.length === 1
                      ? "Your records contain one investment. Review concentration and diversification across suitable asset types."
                      : "Review whether your allocation is concentrated in one asset type, and consider costs and liquidity."}
                  </li>
                </ul>
                <Link className="text-link" href="/app/settings">
                  Update your investment profile ↗
                </Link>
              </Card>
            </div>
          )}
          <div className="three-grid">
            {data.investments.map((i) => (
              <Card key={i.id}>
                <div className="record-card">
                  <span className="badge">{i.type}</span>
                  <h3>{i.name}</h3>
                  <div className="record-value">{money(i.amount)}</div>
                  <p>{money(i.monthly)} monthly contribution</p>
                  {controls(i)}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
      {rows.length === 0 && (
        <Card>
          <Empty onAdd={() => setEditing("new")} />
        </Card>
      )}
      {editing && (
        <RecordForm
          kind={kind}
          month={month}
          initial={
            editing === "new"
              ? undefined
              : (editing as unknown as Record<
                  string,
                  string | number | boolean
                >)
          }
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      )}{" "}
      {deleting && (
        <DeleteRecord
          kind={kind}
          id={deleting}
          onClose={() => setDeleting(null)}
          onSaved={reload}
        />
      )}{" "}
      {contributing && (
        <Modal
          title={`Contribute to ${contributing.name}`}
          onClose={() => setContributing(null)}
        >
          <form onSubmit={contribution}>
            <Field
              label="Contribution (₹)"
              hint={`Remaining: ${money(contributing.remaining)}. Contributions update your goal balance, not transaction cash flow.`}
            >
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                max={contributing.remaining}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
              <button className="button primary" disabled={busy}>
                {busy ? <Spinner /> : "Confirm contribution"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
type Plan = {
  months: number | null;
  interest: number;
  order: string[];
  payable: boolean;
  schedule: { month: number; balance: number }[];
};
function DebtSimulator() {
  const [strategy, setStrategy] = useState("avalanche");
  const [extra, setExtra] = useState("0");
  const [result, setResult] = useState<{ plan: Plan; baseline: Plan } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function calculate() {
    setBusy(true);
    setError("");
    try {
      setResult(
        await api(
          "/debts/plan?strategy=" +
            strategy +
            "&extra=" +
            encodeURIComponent(extra),
        ),
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    api<{ plan: Plan; baseline: Plan }>("/debts/plan")
      .then(setResult)
      .catch((err) => setError(err.message));
  }, []);
  return (
    <Card
      title="Find your repayment path"
      subtitle="A simulation with fixed interest rates and a constant monthly payment budget"
    >
      <div className="filters">
        <Field label="Strategy">
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
          >
            <option value="avalanche">
              Avalanche · highest interest first
            </option>
            <option value="snowball">Snowball · smallest balance first</option>
          </select>
        </Field>
        <Field label="Additional monthly payment (₹)">
          <input
            type="number"
            min="0"
            step="100"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
          />
        </Field>
        <button className="button primary" disabled={busy} onClick={calculate}>
          {busy ? <Spinner /> : "Compare plan"}
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
      {result && (
        <div className="stack" style={{ marginTop: 22 }}>
          <div className="three-grid">
            <div>
              <p className="small">Estimated payoff</p>
              <h2>
                {result.plan.months === null
                  ? "Beyond 50 years"
                  : `${result.plan.months} months`}
              </h2>
            </div>
            <div>
              <p className="small">Estimated interest</p>
              <h2>{money(result.plan.interest)}</h2>
            </div>
            <div>
              <p className="small">Without additional payment</p>
              <h2>
                {result.baseline.months === null
                  ? "Beyond 50 years"
                  : `${result.baseline.months} months`}
              </h2>
            </div>
          </div>
          <p className="small">
            Repayment order:{" "}
            {result.plan.order.join(" → ") ||
              "Add debt to compare repayment strategies."}
          </p>
          {!result.plan.payable && (
            <p className="form-error">
              This payment plan does not clear the debt within 600 months.
              Consider a larger affordable payment.
            </p>
          )}
          <p className="small muted">
            Interest accrues monthly at APR ÷ 12. Minimum payments are made
            first; remaining funds follow the selected order. Freed payments
            roll into the next debt. Fees and changing rates are excluded.
            Estimates are not guaranteed payoff dates.
          </p>
        </div>
      )}
    </Card>
  );
}
export function Reports({ data }: { data: Summary }) {
  return (
    <div className="stack">
      <div className="print-heading">
        <h1>FinSaathi · Personal Financial Report</h1>
        <p>
          {data.start} to {data.end}
        </p>
      </div>
      <div className="section-toolbar no-print">
        <p>
          {data.start} to {data.end} · Budgets use the selected calendar month;
          goals, debts and investments show current balances.
        </p>
        <div className="filters">
          <a
            className="button"
            href={`/api/records/transactions?export=csv&start=${data.start}&end=${data.end}`}
          >
            <Download size={16} />
            Export CSV
          </a>
          <button className="button primary" onClick={() => window.print()}>
            Print / Save PDF
          </button>
        </div>
      </div>
      <SummaryKpis data={data} />
      <div className="two-grid">
        <Card title="Income, expenses and net cash flow">
          <CashChart data={data.history} />
          <p className="small">
            Selected period net cash flow: {money(data.net)}. Savings rate:{" "}
            {percent(data.savings_rate)}. Chart shows six calendar months.
          </p>
        </Card>
        <Card title="Top expense categories">
          {data.categories.length ? (
            <Donut data={data.categories} />
          ) : (
            <Empty />
          )}
        </Card>
        <Card title="Budget performance">
          {data.budgets.length ? (
            <BudgetRows rows={data.budgets} />
          ) : (
            <p>No budgets for this month.</p>
          )}
        </Card>
        <Card title="Goal progress">
          <div className="rows">
            {data.goals.map((g) => (
              <div key={g.id}>
                <div className="spread">
                  <strong>{g.name}</strong>
                  <span>{g.progress.toFixed(0)}%</span>
                </div>
                <Progress value={g.progress} />
                <p className="small">
                  {money(g.current)} / {money(g.target)} ·{" "}
                  {money(g.required_monthly)} required monthly
                </p>
              </div>
            ))}
            {!data.goals.length && <p>No goals recorded.</p>}
          </div>
        </Card>
        <Card title="Debt summary">
          <h2>{money(data.debt_total)}</h2>
          <p>
            {money(data.debt_payments)} monthly payments ·{" "}
            {percent(data.debt_to_income)} debt-to-income ratio
          </p>
          {data.debts.map((d) => (
            <p className="small" key={d.id}>
              {d.name}: {money(d.balance)} at {d.rate}% APR
            </p>
          ))}
        </Card>
        <Card title="Investment summary">
          <h2>{money(data.invested)}</h2>
          <p>{money(data.investing_monthly)} monthly contributions</p>
          {data.investments.map((i) => (
            <p className="small" key={i.id}>
              {i.name}: {money(i.amount)} · {i.type}
            </p>
          ))}
        </Card>
        <Card title="Financial health">
          <div className="health-overview">
            <ScoreRing score={data.health.score} />
            <div>
              <h3>{data.health.status}</h3>
              <p className="small">{data.health.explanation}</p>
            </div>
          </div>
        </Card>
        <Card title="Expense prediction">
          <h2>{money(data.prediction.prediction)}</h2>
          <p>
            {data.prediction.month} · {data.prediction.method}
          </p>
          <p className="small">{data.prediction.explanation}</p>
        </Card>
      </div>
      <Card title="Personalized insights and suggested actions">
        <ul className="insights-list">
          {[...data.insights, ...data.health.recommendations].map(
            (i, index) => (
              <li key={index}>{i}</li>
            ),
          )}
        </ul>
      </Card>
      <p className="notice">
        This report provides educational financial insights and does not provide
        professional investment advice. Values depend on your recorded
        information.
      </p>
    </div>
  );
}
