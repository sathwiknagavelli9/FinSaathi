"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="legal">
      <h1>Something didn’t load.</h1>
      <p>Please try again. Your saved records are still in your account.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
