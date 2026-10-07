export default function Home() {
  return (
    <main className="container">
      <div className="card" style={{ maxWidth: 720 }}>
        <span className="badge">Student prototype</span>
        <h1>GCScrape</h1>
        <p className="muted">
          Connect a test Google Classroom account and organize the coursework
          and classwork materials you can access.
        </p>
        <a className="btn" href="/api/auth/login">
          Connect Google Classroom
        </a>
      </div>
    </main>
  );
}
