import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppNav from "@/app/components/nav";
import { sessionCookie } from "@/app/lib/session";

export default async function AboutPage() {
  if (!(await cookies()).get(sessionCookie)?.value) redirect("/");
  return <div className="app-shell"><AppNav /><main className="page-content"><section className="about-panel">
    <div className="eyebrow">About GCScrape</div><h1>A simpler way to see your schoolwork.</h1>
    <p>GCScrape is a student-facing dashboard for organizing the Google Classroom data your account is allowed to access.</p>
    <div className="about-grid">
      <div><span>01</span><h2>Read-only first</h2><p>The current Classroom integration reads courses, assignments, materials, and your own submission status.</p></div>
      <div><span>02</span><h2>One workspace</h2><p>Instead of switching between classes, your accessible work is combined into one searchable data view.</p></div>
      <div><span>03</span><h2>More control</h2><p>Personal organization features, including marking items as useless, are being added next.</p></div>
    </div>
  </section></main></div>;
}
