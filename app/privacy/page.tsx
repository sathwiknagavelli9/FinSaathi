import Link from "next/link";
export default function Page() {
  return (
    <main className="legal">
      <Link href="/">← FinSaathi</Link>
      <h1>Privacy</h1>
      <p>
        FinSaathi stores your account details, password hash, financial records
        and chat history in MongoDB Atlas. Authentication uses an HTTP-only
        session cookie. Financial records are scoped to your signed-in account.
      </p>
      <h2>Your AI conversations</h2>
      <p>
        When you use FinSaathi AI, your message and a concise financial summary
        are sent to Groq to produce a response. Your name, email, password and
        raw transaction descriptions are not included in that summary. Avoid
        putting sensitive identifiers in chat messages.
      </p>
      <h2>Your controls</h2>
      <p>
        You can export transactions, remove demo records, and clear financial
        records and chat history in Settings. This does not delete your account
        or profile. FinSaathi does not connect to your bank or execute
        transactions.
      </p>
      <h2>Prototype service</h2>
      <p>
        This academic project relies on free hosting, database and AI services.
        Availability and retention depend on these providers and the project
        operator. Do not use it as your only financial record.
      </p>
    </main>
  );
}
