import Link from "next/link";
export default function Page() {
  return (
    <main className="legal">
      <Link href="/">← FinSaathi</Link>
      <h1>Terms of use</h1>
      <p>
        FinSaathi is an educational personal financial planning and decision
        support project. It does not provide professional investment, tax or
        legal advice.
      </p>
      <h2>Estimates and responsibility</h2>
      <p>
        Forecasts and debt simulations depend on your inputs and simplifying
        assumptions. They are not guarantees. Financial health scores are
        educational indicators, not credit scores. Verify important decisions
        independently and consult a qualified professional where appropriate.
      </p>
      <h2>Acceptable use</h2>
      <p>
        Use your own account and accurate information. Do not attempt to access
        another person’s records, abuse the service, or submit unlawful content.
        Keep your password private.
      </p>
      <h2>Availability</h2>
      <p>
        The service uses free tiers and may be unavailable or rate limited. No
        paid subscription, trade execution or banking connection is provided.
      </p>
    </main>
  );
}
