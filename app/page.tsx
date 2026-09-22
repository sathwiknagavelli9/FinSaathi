import Link from "next/link";
import {
  ArrowRight,
  ChartNoAxesCombined,
  ShieldCheck,
  Target,
  WalletCards,
  Sparkles,
  TrendingUp,
  Landmark,
  HeartPulse,
  Bell,
  MessageSquareText,
  FileChartColumn,
  Check,
} from "lucide-react";
import { Logo } from "@/components/ui";
const features = [
  [
    "Smart financial dashboard",
    "Your whole financial picture, thoughtfully brought together.",
    WalletCards,
  ],
  [
    "AI expense analyzer",
    "Find patterns in the way you spend.",
    ChartNoAxesCombined,
  ],
  [
    "Expense prediction",
    "See what your spending history suggests is ahead.",
    TrendingUp,
  ],
  [
    "Smart budget planner",
    "Give every category a practical spending limit.",
    Landmark,
  ],
  ["Goal planner", "Turn your next big thing into monthly steps.", Target],
  [
    "Debt escape",
    "Compare snowball and avalanche repayment plans.",
    ShieldCheck,
  ],
  [
    "Investment advisor",
    "Explore your allocation with educational guidance.",
    Landmark,
  ],
  [
    "Financial health score",
    "Understand the habits behind your financial health.",
    HeartPulse,
  ],
  ["Smart alerts", "Know when your plan needs a little attention.", Bell],
  [
    "AI financial assistant",
    "Ask questions about your own financial picture.",
    MessageSquareText,
  ],
  [
    "Personalized reports",
    "Bring your progress into a clear, shareable report.",
    FileChartColumn,
  ],
] as const;
export default function Home() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <Logo />
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#about">About</a>
        </div>
        <div className="nav-actions">
          <Link href="/login">Log in</Link>
          <Link className="button primary" href="/register">
            Get started <ArrowRight size={16} />
          </Link>
        </div>
      </nav>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={15} />
              YOUR AI FINANCIAL COMPANION
            </div>
            <h1>
              A clearer picture.
              <br />A smarter plan.
              <br />
              <em>A better tomorrow.</em>
            </h1>
            <p>
              Take control of your money with AI. Understand your spending,
              build better budgets, and make room for the things that matter.
            </p>
            <div className="hero-actions">
              <Link className="button primary large" href="/register">
                Start your financial journey <ArrowRight size={18} />
              </Link>
              <a className="text-link" href="#features">
                Explore features ↗
              </a>
            </div>
            <div className="hero-proof">
              <span>
                <Check size={15} />
                Free to use
              </span>
              <span>
                <Check size={15} />
                Your data, your space
              </span>
              <span>
                <Check size={15} />
                Made for real life
              </span>
            </div>
          </div>
          <div className="preview-wrap">
            <div className="preview">
              <div className="spread">
                <Logo />
                <span className="badge">Illustrative preview</span>
              </div>
              <div className="preview-heading">
                <small>YOUR MONEY, AT A GLANCE</small>
                <h2>
                  Good morning, Aarya <span>☀</span>
                </h2>
                <p>You’re making room for your next chapter.</p>
              </div>
              <div className="preview-kpis">
                <div>
                  <small>Monthly income</small>
                  <strong>₹68,000</strong>
                  <span>September overview</span>
                </div>
                <div>
                  <small>Net savings</small>
                  <strong>₹24,500</strong>
                  <span className="teal">36% of monthly income</span>
                </div>
              </div>
              <div className="preview-chart">
                <div className="spread">
                  <strong>Your cash flow</strong>
                  <small>Last 6 months</small>
                </div>
                <div className="mini-bars">
                  {[48, 65, 55, 77, 68, 91].map((h, i) => (
                    <div key={i}>
                      <span style={{ height: h + "%" }} />
                      <span style={{ height: h * 0.6 + "%" }} />
                      <small>
                        {["Apr", "May", "Jun", "Jul", "Aug", "Sep"][i]}
                      </small>
                    </div>
                  ))}
                </div>
              </div>
              <div className="preview-goal">
                <span className="empty-icon">
                  <Target size={22} />
                </span>
                <div>
                  <strong>A little closer to your goals</strong>
                  <p>Emergency reserve · 40% saved</p>
                  <div className="progress">
                    <span style={{ width: "40%" }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="floating-note">
              <ShieldCheck size={21} />
              <div>
                <strong>Better habits. Brighter future.</strong>
                <span>Small steps add up.</span>
              </div>
            </div>
          </div>
        </section>
        <section className="feature-section" id="features">
          <div className="section-intro">
            <span className="eyebrow">A LITTLE CLARITY GOES A LONG WAY</span>
            <h2>
              Everything your money needs.
              <br />
              Together in one place.
            </h2>
            <p>
              From everyday spending to long-term dreams, make decisions with a
              little more confidence.
            </p>
          </div>
          <div className="feature-grid">
            {features.map(([title, text, Icon]) => (
              <article key={title}>
                <div className="feature-icon">
                  <Icon size={22} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="how-it-works" className="how-section">
          <div className="section-intro">
            <span className="eyebrow">SIMPLE STEPS. MEANINGFUL PROGRESS.</span>
            <h2>Your plan starts with you.</h2>
          </div>
          <div className="steps-grid">
            {[
              [
                "Add your financial picture",
                "Bring in income, expenses, goals and debts.",
              ],
              [
                "Find the patterns",
                "See where your money is going with clear analytics.",
              ],
              [
                "Make an informed plan",
                "Explore forecasts and personalized insights.",
              ],
              [
                "Keep moving forward",
                "Track your progress, one month at a time.",
              ],
            ].map(([title, text], i) => (
              <article key={title}>
                <span>0{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="about" className="about-section">
          <div>
            <span className="eyebrow">BUILT FOR FINANCIAL CONFIDENCE</span>
            <h2>
              Your money story.
              <br />
              Written with intention.
            </h2>
            <p>
              FinSaathi is an AI-powered personal financial planning and
              decision support system. It combines transparent calculations,
              explainable expense predictions, and a financial assistant to help
              you understand your options.
            </p>
          </div>
          <Link href="/register" className="button primary large">
            Build your plan <ArrowRight size={18} />
          </Link>
        </section>
      </main>
      <footer>
        <Logo />
        <p>
          Educational financial insights. Not professional investment advice.
        </p>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <a href="https://github.com/sathwiknagavelli9/FinSaathi">GitHub</a>
        </div>
      </footer>
    </div>
  );
}
