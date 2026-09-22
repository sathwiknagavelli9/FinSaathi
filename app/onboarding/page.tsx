"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { User, Debt, Goal } from "@/lib/types";
import { Field, Logo, Card, Spinner, Loading } from "@/components/ui";
import { RecordForm } from "@/components/record-form";
export default function Onboarding() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"debts" | "goals" | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  function refresh() {
    api<Debt[]>("/records/debts").then(setDebts);
    api<Goal[]>("/records/goals").then(setGoals);
  }
  useEffect(() => {
    api<User>("/auth/me")
      .then((u) => {
        if (u.onboarded) router.replace("/app/dashboard");
        else {
          setUser(u);
          refresh();
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);
  if (!user)
    return (
      <main className="legal">
        <Loading />
      </main>
    );
  const labels = [
    "Your profile",
    "Financial position",
    "Debt",
    "Goals",
    "Investment profile",
  ];
  function update(key: string, value: string) {
    setUser((u) => (u ? { ...u, [key]: value } : u));
  }
  function input(key: keyof User, label: string, type = "number") {
    return (
      <Field label={label}>
        <input
          value={String(user?.[key] ?? "")}
          type={type}
          min={0}
          step={type === "number" ? "0.01" : undefined}
          required
          onChange={(e) => update(key, e.target.value)}
        />
      </Field>
    );
  }
  async function next(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const u = await api<User>("/profile", {
        method: "PATCH",
        body: JSON.stringify({ ...user, onboarded: step === 4 }),
      });
      setUser(u);
      if (step === 4) {
        toast.success("Your FinSaathi account is ready.");
        router.push("/app/dashboard");
      } else setStep(step + 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="onboarding">
      <Logo />
      <div className="eyebrow">LET’S MAKE THIS YOURS</div>
      <h1>A little about you. A better plan ahead.</h1>
      <p>
        Build your starting picture. You can update every detail later in
        Settings and your planning pages.
      </p>
      <div className="onboarding-steps">
        {labels.map((l, i) => (
          <span className={i === step ? "active" : ""} key={l}>
            0{i + 1} · {l}
          </span>
        ))}
      </div>
      <Card title={labels[step]} subtitle={`Step ${step + 1} of 5`}>
        <form onSubmit={next}>
          <div className="form-grid">
            {step === 0 && (
              <>
                {input("name", "Full name", "text")}
                <Field label="Age range">
                  <select
                    value={user.age_range || ""}
                    required
                    onChange={(e) => update("age_range", e.target.value)}
                  >
                    <option value="">Select age range</option>
                    {[
                      "Under 18",
                      "18–24",
                      "25–34",
                      "35–44",
                      "45–54",
                      "55+",
                    ].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Occupation">
                  <select
                    value={user.occupation || ""}
                    required
                    onChange={(e) => update("occupation", e.target.value)}
                  >
                    <option value="">Select occupation</option>
                    {[
                      "Student",
                      "Salaried Employee",
                      "Self-employed",
                      "Business",
                      "Other",
                    ].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Currency">
                  <select defaultValue="INR">
                    <option value="INR">INR · Indian Rupee</option>
                  </select>
                </Field>
                {input("monthly_income", "Approximate monthly income (₹)")}
              </>
            )}
            {step === 1 && (
              <>
                {input("monthly_expenses", "Approximate monthly expenses (₹)")}
                {input("savings", "Current savings (₹)")}
                {input("emergency_fund", "Emergency fund (₹)")}
                <p className="notice wide">
                  These are starting estimates. Dashboard cash flow is
                  calculated from your transactions.
                </p>
              </>
            )}
            {step === 2 && (
              <div className="wide stack">
                <p>Add any outstanding debt, or continue if you have none.</p>
                {debts.map((d) => (
                  <div className="spread" key={d.id}>
                    <strong>{d.name}</strong>
                    <span>₹{d.balance.toLocaleString("en-IN")}</span>
                  </div>
                ))}
                <button
                  type="button"
                  className="button"
                  onClick={() => setModal("debts")}
                >
                  + Add a debt
                </button>
              </div>
            )}
            {step === 3 && (
              <div className="wide stack">
                <p>
                  What are you saving for? Add a goal now, or start one later.
                </p>
                {goals.map((g) => (
                  <div className="spread" key={g.id}>
                    <strong>{g.name}</strong>
                    <span>{g.target_date}</span>
                  </div>
                ))}
                <button
                  type="button"
                  className="button"
                  onClick={() => setModal("goals")}
                >
                  + Add a goal
                </button>
              </div>
            )}
            {step === 4 && (
              <>
                {input(
                  "current_investments",
                  "Approximate current investments (₹)",
                )}
                {input(
                  "investment_capacity",
                  "Monthly investment capacity (₹)",
                )}
                <Field label="Risk tolerance">
                  <select
                    value={user.risk || ""}
                    required
                    onChange={(e) => update("risk", e.target.value)}
                  >
                    <option value="">Select risk tolerance</option>
                    {["Conservative", "Moderate", "Aggressive"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </Field>
                {input("investment_horizon", "Investment horizon (years)")}
                <p className="notice wide">
                  FinSaathi provides educational financial insights and does not
                  provide professional investment advice.
                </p>
              </>
            )}
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            {step > 0 && (
              <button
                type="button"
                className="button"
                onClick={() => setStep(step - 1)}
              >
                Back
              </button>
            )}
            <button className="button primary" disabled={busy}>
              {busy ? <Spinner /> : step === 4 ? "Finish setup" : "Continue →"}
            </button>
          </div>
        </form>
      </Card>
      {modal && (
        <RecordForm
          kind={modal}
          onClose={() => setModal(null)}
          onSaved={refresh}
        />
      )}
    </main>
  );
}
