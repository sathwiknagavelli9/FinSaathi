import { notFound } from "next/navigation";
import { FinancePage } from "@/components/finance-page";
const pages = [
  "dashboard",
  "transactions",
  "analyzer",
  "prediction",
  "budgets",
  "goals",
  "debts",
  "investments",
  "health",
  "alerts",
  "assistant",
  "reports",
  "settings",
];
export function generateStaticParams() {
  return pages.map((slug) => ({ slug }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!pages.includes(slug)) notFound();
  return <FinancePage slug={slug} />;
}
