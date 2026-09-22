import Link from "next/link";
export default function NotFound() {
  return (
    <main className="legal">
      <h1>This page isn’t here.</h1>
      <p>Let’s get back to your financial picture.</p>
      <Link className="button primary" href="/">
        Go to FinSaathi
      </Link>
    </main>
  );
}
