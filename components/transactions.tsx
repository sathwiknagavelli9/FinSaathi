"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Download } from "lucide-react";
import { useApp } from "@/components/app-shell";
import { RecordForm, DeleteRecord } from "@/components/record-form";
import { Card, Field, Empty, Loading, ErrorState } from "@/components/ui";
import { api, money, expenseCategories, incomeCategories } from "@/lib/api";
import type { Transaction } from "@/lib/types";
export function Transactions() {
  const { month, refreshAlerts } = useApp();
  const [items, setItems] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [start, setStart] = useState(month + "-01");
  const [end, setEnd] = useState(() => {
    const [year, value] = month.split("-").map(Number);
    return month + "-" + new Date(year, value, 0).getDate();
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Transaction | "new" | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  useEffect(() => {
    const [y, m] = month.split("-").map(Number);
    setStart(month + "-01");
    setEnd(month + "-" + new Date(y, m, 0).getDate());
    setPage(1);
  }, [month]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);
  const query = new URLSearchParams({
    page: String(page),
    search: searchQuery,
    type,
    category,
    sort,
    start,
    end,
  }).toString();
  const load = useCallback(() => {
    setLoading(true);
    setError("");
    api<{ items: Transaction[]; total: number }>(
      "/records/transactions?" + query,
    )
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [query]);
  useEffect(() => {
    load();
  }, [load]);
  function saved() {
    load();
    refreshAlerts();
  }
  return (
    <div className="stack">
      <div className="section-toolbar">
        <p>A record of the everyday choices that shape your future.</p>
        <div className="filters">
          <a
            className="button"
            href={"/api/records/transactions?" + query + "&export=csv"}
          >
            <Download size={16} />
            Export CSV
          </a>
          <button className="button primary" onClick={() => setEditing("new")}>
            <Plus size={16} />
            Add transaction
          </button>
        </div>
      </div>
      <Card>
        <div className="filters">
          <Field label="Search descriptions">
            <input
              placeholder="Search transactions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field>
          <Field label="From">
            <input
              type="date"
              value={start}
              onChange={(e) => {
                setStart(e.target.value);
                setPage(1);
              }}
            />
          </Field>
          <Field label="To">
            <input
              type="date"
              value={end}
              onChange={(e) => {
                setEnd(e.target.value);
                setPage(1);
              }}
            />
          </Field>
          <Field label="Type">
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All types</option>
              <option>Income</option>
              <option>Expense</option>
            </select>
          </Field>
          <Field label="Category">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All categories</option>
              {[...new Set([...expenseCategories, ...incomeCategories])].map(
                (c) => (
                  <option key={c}>{c}</option>
                ),
              )}
            </select>
          </Field>
          <Field label="Sort">
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="amount">Highest amount</option>
            </select>
          </Field>
        </div>
      </Card>
      {error ? (
        <ErrorState message={error} retry={load} />
      ) : loading ? (
        <Loading />
      ) : (
        <Card>
          {items.length ? (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((t) => (
                      <tr key={t.id}>
                        <td>{t.date}</td>
                        <td className="description">
                          {t.description}
                          {t.recurring && (
                            <span className="muted"> · Recurring</span>
                          )}
                        </td>
                        <td>{t.category}</td>
                        <td>
                          <span className="badge">{t.type}</span>
                        </td>
                        <td className={t.type === "Income" ? "teal" : ""}>
                          {t.type === "Income" ? "+" : "−"}
                          {money(t.amount)}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="icon-button"
                              aria-label={"Edit " + t.description}
                              onClick={() => setEditing(t)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="icon-button"
                              aria-label={"Delete " + t.description}
                              onClick={() => setDeleting(t.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <span>
                  {total} records · Page {page} of{" "}
                  {Math.max(1, Math.ceil(total / 20))}
                </span>
                <div>
                  <button
                    className="button small"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="button small"
                    disabled={page * 20 >= total}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <Empty
              title="No transactions in this view"
              text="Try a different filter, or add your first transaction to start seeing financial insights."
              onAdd={() => setEditing("new")}
            />
          )}
        </Card>
      )}
      {editing && (
        <RecordForm
          kind="transactions"
          initial={
            editing === "new"
              ? undefined
              : (editing as unknown as Record<
                  string,
                  string | number | boolean
                >)
          }
          onClose={() => setEditing(null)}
          onSaved={saved}
        />
      )}{" "}
      {deleting && (
        <DeleteRecord
          kind="transactions"
          id={deleting}
          onClose={() => setDeleting(null)}
          onSaved={saved}
        />
      )}
    </div>
  );
}
