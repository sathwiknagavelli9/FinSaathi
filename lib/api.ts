export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch("/api" + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "same-origin",
  });
  const body = await response
    .json()
    .catch(() => ({ error: "Unable to connect to the server." }));
  if (!response.ok)
    throw new Error(body.error || "Unable to complete this request.");
  return body.data as T;
}
export function money(value: number | null | undefined, currency = "INR") {
  return value == null
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(value);
}
export function percent(value: number | null | undefined) {
  return value == null ? "—" : `${value.toFixed(1)}%`;
}
export function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
export function today() {
  const d = new Date();
  return `${currentMonth()}-${String(d.getDate()).padStart(2, "0")}`;
}
export const expenseCategories = [
  "Food",
  "Housing",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Utilities/Bills",
  "Healthcare",
  "Education",
  "EMI/Debt",
  "Investment",
  "Travel",
  "Other",
];
export const incomeCategories = [
  "Salary",
  "Business",
  "Freelance",
  "Allowance",
  "Investment Income",
  "Other",
];
