"use client";
import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  ArrowLeftRight,
  ChartNoAxesCombined,
  TrendingUp,
  WalletCards,
  Target,
  Landmark,
  ChartPie,
  HeartPulse,
  Bell,
  MessageSquareText,
  FileChartColumn,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api, currentMonth } from "@/lib/api";
import type { User, Alert } from "@/lib/types";
import { Logo, Loading, ErrorState } from "@/components/ui";
export const navigation = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["transactions", "Transactions", ArrowLeftRight],
  ["analyzer", "Expense Analyzer", ChartNoAxesCombined],
  ["prediction", "Expense Prediction", TrendingUp],
  ["budgets", "Budget Planner", WalletCards],
  ["goals", "Goals", Target],
  ["debts", "Debt Escape", Landmark],
  ["investments", "Investments", ChartPie],
  ["health", "Financial Health", HeartPulse],
  ["alerts", "Alerts", Bell],
  ["assistant", "AI Assistant", MessageSquareText],
  ["reports", "Reports", FileChartColumn],
  ["settings", "Settings", Settings],
] as const;
type Context = {
  user: User;
  setUser: (u: User) => void;
  month: string;
  setMonth: (m: string) => void;
  refreshAlerts: () => void;
};
const AppContext = createContext<Context | null>(null);
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("App context missing");
  return context;
}
export function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(currentMonth);
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { theme, setTheme } = useTheme();
  const [ready, setReady] = useState(false);
  const path = usePathname();
  const router = useRouter();
  function refreshAlerts() {
    api<Alert[]>("/alerts")
      .then(setAlerts)
      .catch(() => {});
  }
  useEffect(() => {
    setReady(true);
    api<User>("/auth/me")
      .then((u) => {
        if (!u.onboarded) {
          router.replace("/onboarding");
          return;
        }
        setUser(u);
        refreshAlerts();
      })
      .catch((err) => {
        if ((err as Error).message.includes("sign in"))
          router.replace("/login");
        else setError((err as Error).message);
      });
  }, [router]);
  useEffect(() => {
    setOpen(false);
  }, [path]);
  if (error)
    return (
      <main className="legal">
        <ErrorState message={error} retry={() => location.reload()} />
      </main>
    );
  if (!user)
    return (
      <main className="legal">
        <Loading />
      </main>
    );
  const title =
    navigation.find(([slug]) => path === "/app/" + slug)?.[1] || "FinSaathi";
  return (
    <AppContext.Provider
      value={{ user, setUser, month, setMonth, refreshAlerts }}
    >
      <div className="app-shell">
        {open && (
          <button
            className="drawer-backdrop"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          />
        )}
        <aside className={`sidebar ${open ? "open" : ""}`}>
          <button
            className="icon-button drawer-close"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
          <Logo />
          <div className="nav-caption">YOUR FINANCIAL SPACE</div>
          <nav aria-label="Main navigation">
            {navigation.map(([slug, label, Icon]) => (
              <Link
                key={slug}
                href={"/app/" + slug}
                className={path === "/app/" + slug ? "active" : ""}
                aria-current={path === "/app/" + slug ? "page" : undefined}
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="profile-row">
              <span className="avatar">
                {user.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <strong>{user.name}</strong>
                <small>Personal account</small>
              </div>
              <button
                className="icon-button"
                aria-label="Log out"
                onClick={async () => {
                  try {
                    await api("/auth/logout", { method: "POST", body: "{}" });
                    router.replace("/login");
                  } catch (err) {
                    toast.error((err as Error).message);
                  }
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <button
              className="icon-button mobile-menu"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <div className="breadcrumb">
              Your workspace <span style={{ margin: "0 12px" }}>/</span>
              <strong>{title}</strong>
            </div>
            <div className="top-actions">
              <input
                type="month"
                aria-label="Selected month"
                value={month}
                onChange={(e) => {
                  if (e.target.value) setMonth(e.target.value);
                }}
              />
              <select
                className="theme-select"
                aria-label="Theme"
                value={ready ? theme : "system"}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
              <Link
                className="icon-button notification"
                href="/app/alerts"
                aria-label={`${alerts.filter((a) => !a.read).length} unread alerts`}
              >
                <Bell size={18} />
                {alerts.some((a) => !a.read) && (
                  <b>{alerts.filter((a) => !a.read).length}</b>
                )}
              </Link>
              <Link
                className="avatar"
                href="/app/settings"
                aria-label="Profile settings"
              >
                {user.name.slice(0, 2).toUpperCase()}
              </Link>
            </div>
          </header>
          <main className="page-content">
            {children}
            <p className="app-footer">
              FinSaathi · Your AI Financial Companion · Educational insights,
              not professional financial advice.
            </p>
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
}
