import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="centered">
      <div className="panel">
        <p className="eyebrow">Page unavailable</p>
        <h1>This page isn’t available to you.</h1>
        <p className="muted">
          It may have moved, or you may no longer belong to this team.
        </p>
        <Link className="button" href="/">
          Back to your workspace
        </Link>
      </div>
    </main>
  );
}
