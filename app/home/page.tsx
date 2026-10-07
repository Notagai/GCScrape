import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppNav from "@/app/components/nav";
import { sessionCookie } from "@/app/lib/session";

export default async function HomePage() {
  if (!(await cookies()).get(sessionCookie)?.value) redirect("/");
  return <div className="app-shell"><AppNav /><main className="page-content">
    <section className="hero-panel"><div><div className="eyebrow">Your workspace</div><h1>Welcome to GCScrape.</h1>
      <p className="hero-copy">Everything from your accessible Google Classroom classes, brought together in one place.</p>
      <a className="primary-button" href="/data">Open your data</a>
    </div><div className="hero-orb" aria-hidden="true">GC</div></section>
    <section className="feature-grid">
      <article className="feature-card"><span className="feature-number">01</span><h2>All classes</h2><p>See assignments and materials from every class in a single view.</p></article>
      <article className="feature-card"><span className="feature-number">02</span><h2>Stay focused</h2><p>Search, sort, and filter the work that matters right now.</p></article>
      <article className="feature-card"><span className="feature-number">03</span><h2>Coming next</h2><p>Mark unhelpful items as useless and keep them out of your way.</p></article>
    </section>
  </main></div>;
}
