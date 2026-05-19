"use client";

import { useState } from "react";

type Rule = {
  Id: string;
  ValidationName: string;
  Active: boolean;
  Description: string | null;
  ErrorMessage: string | null;
};

type Props = {
  username: string;
  orgName: string;
};

export default function Dashboard({ username, orgName }: Props) {
  const [rules, setRules] = useState<Rule[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [bulkBusy, setBulkBusy] = useState(false);

  async function fetchRules() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rules");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "request failed");
      setRules(data.rules);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateOne(rule: Rule, nextActive: boolean) {
    const res = await fetch(`/api/rules/${rule.Id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: nextActive }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "request failed");
  }

  async function toggleRule(rule: Rule) {
    const nextActive = !rule.Active;
    setBusy((b) => ({ ...b, [rule.Id]: true }));
    setError(null);

    try {
      await updateOne(rule, nextActive);
      setRules((prev) =>
        prev
          ? prev.map((r) =>
              r.Id === rule.Id ? { ...r, Active: nextActive } : r
            )
          : prev
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy((b) => ({ ...b, [rule.Id]: false }));
    }
  }

  async function setAll(nextActive: boolean) {
    if (!rules) return;
    const targets = rules.filter((r) => r.Active !== nextActive);
    if (targets.length === 0) return;

    setBulkBusy(true);
    setError(null);
    setBusy((b) => {
      const next = { ...b };
      for (const r of targets) next[r.Id] = true;
      return next;
    });

    for (const r of targets) {
      try {
        await updateOne(r, nextActive);
        setRules((prev) =>
          prev
            ? prev.map((x) => (x.Id === r.Id ? { ...x, Active: nextActive } : x))
            : prev
        );
      } catch (e: any) {
        setError(`${r.ValidationName}: ${e.message}`);
        break;
      } finally {
        setBusy((b) => ({ ...b, [r.Id]: false }));
      }
    }

    setBulkBusy(false);
  }

  const hasRules = rules && rules.length > 0;
  const anyInactive = hasRules && rules!.some((r) => !r.Active);
  const anyActive = hasRules && rules!.some((r) => r.Active);

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <header className="mb-12 pt-4">
        <h1 className="serif text-4xl sm:text-5xl leading-[0.95] mb-8">
          Salesforce <span className="italic">validation rules</span> switch
          <span className="text-accent">.</span>
        </h1>

        <div className="h-px w-full bg-line mb-6" />

        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="mono text-[11px] uppercase tracking-[0.2em] text-muted mb-1.5">
              signed in
            </p>
            <p className="text-sm">
              <span className="mono">{username}</span>
              {orgName && orgName !== "N/A" && (
                <span className="text-muted"> · {orgName}</span>
              )}
            </p>
          </div>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="mono text-[11px] uppercase tracking-[0.18em] px-3.5 py-2 border border-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              Log out
            </button>
          </form>
        </div>
      </header>

      <div className="mb-5">
        <h2 className="serif text-2xl italic">Account object</h2>
        <p className="mono text-[11px] uppercase tracking-[0.2em] text-muted mt-1">
          validation rules
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={fetchRules}
          disabled={loading || bulkBusy}
          className="px-3 py-1.5 text-sm border border-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "loading..." : rules ? "refresh" : "Get Metadata"}
        </button>

        {hasRules && (
          <>
            <button
              onClick={() => setAll(true)}
              disabled={bulkBusy || !anyInactive}
              className="px-3 py-1.5 text-sm border border-green-600 text-green-700 hover:bg-green-600 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {bulkBusy ? "working..." : "Enable all"}
            </button>
            <button
              onClick={() => setAll(false)}
              disabled={bulkBusy || !anyActive}
              className="px-3 py-1.5 text-sm border border-red-600 text-red-700 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {bulkBusy ? "working..." : "Disable all"}
            </button>
            <span className="mono text-xs text-muted ml-auto">
              {rules!.length} rule{rules!.length === 1 ? "" : "s"}
            </span>
          </>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 px-3 py-2 border border-red-300 bg-red-50 text-red-800 text-sm"
        >
          {error}
        </div>
      )}

      {rules && rules.length === 0 && (
        <p className="text-sm text-muted">
          No validation rules on the Account object. Add a couple in Setup and
          come back.
        </p>
      )}

      {hasRules && (
        <ul className="border border-line divide-y divide-line">
          {rules!.map((rule) => (
            <li key={rule.Id} className="px-4 py-3 flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <div className="mono text-sm">{rule.ValidationName}</div>
                {rule.ErrorMessage && (
                  <div className="text-xs text-muted mt-0.5 truncate">
                    {rule.ErrorMessage}
                  </div>
                )}
              </div>

              <button
                onClick={() => toggleRule(rule)}
                disabled={busy[rule.Id] || bulkBusy}
                aria-pressed={rule.Active}
                className={`shrink-0 min-w-[120px] text-sm font-medium px-5 py-2.5 text-white transition-colors disabled:opacity-60 ${
                  rule.Active
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {busy[rule.Id]
                  ? "saving..."
                  : rule.Active
                  ? "Active"
                  : "Inactive"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
