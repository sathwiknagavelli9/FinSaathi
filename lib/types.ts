export type RecordData = {
  id: string;
  [key: string]: string | number | boolean | unknown[] | undefined;
};
export type User = {
  id: string;
  name: string;
  email: string;
  onboarded: boolean;
  currency: string;
  occupation?: string;
  age_range?: string;
  monthly_income?: number;
  monthly_expenses?: number;
  savings?: number;
  emergency_fund?: number;
  risk?: string;
  investment_capacity?: number;
  investment_horizon?: number;
  current_investments?: number;
};
export type Category = { name: string; amount: number; share?: number };
export type Budget = {
  id: string;
  category: string;
  amount: number;
  spent: number;
  utilization: number;
  month: string;
};
export type Goal = {
  id: string;
  name: string;
  category: string;
  target: number;
  current: number;
  target_date: string;
  priority: string;
  progress: number;
  remaining: number;
  required_monthly: number;
  months_remaining: number;
  overdue: boolean;
  completed: boolean;
};
export type Debt = {
  id: string;
  name: string;
  type: string;
  balance: number;
  rate: number;
  payment: number;
  due_date: string;
};
export type Investment = {
  id: string;
  name: string;
  type: string;
  amount: number;
  monthly: number;
};
export type Transaction = {
  id: string;
  date: string;
  description: string;
  type: string;
  category: string;
  amount: number;
  payment_method: string;
  recurring: boolean;
};
export type Alert = {
  id: string;
  title: string;
  message: string;
  severity: string;
  read: boolean;
};
export type Summary = {
  month: string;
  start: string;
  end: string;
  income: number;
  expenses: number;
  net: number;
  savings_rate: number | null;
  total_budget: number;
  remaining_budget: number | null;
  expense_change: number | null;
  income_change: number | null;
  average_daily: number;
  categories: Category[];
  history: { month: string; income: number; expenses: number }[];
  weekly: Category[];
  day_type: Category[];
  pattern: string;
  budgets: Budget[];
  budget_suggestions: { category: string; amount: number; months: number }[];
  goals: Goal[];
  debts: Debt[];
  debt_total: number;
  debt_payments: number;
  debt_to_income: number | null;
  investments: Investment[];
  invested: number;
  investing_monthly: number;
  health: {
    score: number | null;
    status: string;
    factors: {
      name: string;
      maximum: number;
      points: number;
      formula: string;
      action: string;
    }[];
    recommendations: string[];
    explanation: string;
  };
  prediction: {
    prediction: number | null;
    method: string;
    adequate: boolean;
    history: { month: string; expenses: number }[];
    categories: Category[];
    month: string;
    explanation: string;
  };
  insights: string[];
  recent: Transaction[];
  health_history: { month: string; score: number }[];
  recurring_obligations: {
    name: string;
    category: string;
    amount: number;
    due_date: string;
  }[];
};
