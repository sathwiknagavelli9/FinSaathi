"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { Field, Logo, Spinner } from "@/components/ui";
export function AuthForm({ register = false }: { register?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    if (register && form.get("password") !== form.get("confirm")) {
      setError("Passwords must match.");
      return;
    }
    setBusy(true);
    try {
      const user = await api<User>(
        "/auth/" + (register ? "register" : "login"),
        { method: "POST", body: JSON.stringify(Object.fromEntries(form)) },
      );
      router.push(user.onboarded ? "/app/dashboard" : "/onboarding");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <aside className="auth-story">
        <Logo />
        <div>
          <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
          <h1>
            Make space for
            <br />a brighter
            <br />
            <em>financial future.</em>
          </h1>
          <p>
            Clarity for today.
            <br />
            Confidence for tomorrow.
          </p>
        </div>
        <span className="auth-assurance">
          <ShieldCheck size={20} />A private space for your financial picture.
        </span>
      </aside>
      <section className="auth-main">
        <div className="auth-form">
          <Link href="/" className="text-link">
            ← Back to FinSaathi
          </Link>
          <h2>
            {register ? "A fresh start for your finances." : "Welcome back."}
          </h2>
          <p>
            {register
              ? "Create your account. Your plan begins with a few simple steps."
              : "Your financial picture is waiting for you."}
          </p>
          <form onSubmit={submit}>
            {register && (
              <Field label="Full name">
                <input
                  name="name"
                  required
                  autoComplete="name"
                  maxLength={100}
                />
              </Field>
            )}
            <Field label="Email address">
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                maxLength={254}
              />
            </Field>
            <Field
              label="Password"
              hint={
                register
                  ? "At least 10 characters, with a letter and a number."
                  : undefined
              }
            >
              <div className="password-input">
                <input
                  name="password"
                  type={visible ? "text" : "password"}
                  required
                  minLength={register ? 10 : 1}
                  maxLength={128}
                  autoComplete={register ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  aria-label={visible ? "Hide password" : "Show password"}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>
            {register && (
              <Field label="Confirm password">
                <input
                  name="confirm"
                  type={visible ? "text" : "password"}
                  required
                  minLength={10}
                  autoComplete="new-password"
                />
              </Field>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary full" disabled={busy}>
              {busy ? (
                <Spinner />
              ) : (
                <>
                  {register ? "Create account" : "Log in"}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
          <p className="auth-switch">
            {register ? "Already have an account?" : "New to FinSaathi?"}{" "}
            <Link href={register ? "/login" : "/register"}>
              {register ? "Log in" : "Create an account"}
            </Link>
          </p>
          <small>
            By continuing, you agree to our <Link href="/terms">Terms</Link> and{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </small>
        </div>
      </section>
    </main>
  );
}
