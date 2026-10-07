import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionCookie } from "@/app/lib/session";

export default async function LandingPage() {
  if ((await cookies()).get(sessionCookie)?.value) redirect("/home");
  return <main className="landing-page"><section className="landing-card">
    <div className="eyebrow">Student workspace</div><h1>Google Classroom, organized.</h1>
    <p className="landing-copy">GCScrape brings the Classroom work you can access into one clean workspace, across all of your classes.</p>
    <a className="primary-button" href="/api/auth/login">Log in with Google</a>
    <p className="landing-note">Read-only Classroom access. You control the Google account you connect.</p>
  </section></main>;
}
