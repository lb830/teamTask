import Link from "next/link";
export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main id="main" className="auth-page">
      <div className="auth-intro">
        <Link className="brand" href="/">
          <span className="brand-icon">
            t<span>↗</span>
          </span>
          teamTask.
        </Link>
        <h1>
          A shared place
          <br />
          for good work.
        </h1>
        <p>Knowledge, progress, and a little more together.</p>
      </div>
      <div className="auth-card panel">
        <p className="eyebrow">YOUR PRIVATE WORKSPACE</p>
        <h2>{title}</h2>
        <p className="muted">{description}</p>
        {children}
      </div>
    </main>
  );
}
