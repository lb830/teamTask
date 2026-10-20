"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="centered">
      <div className="panel">
        <p className="eyebrow">Something went wrong</p>
        <h1>We couldn’t open this page.</h1>
        <p className="muted">
          Try again. If the problem continues, ask your administrator to check
          the service configuration.
        </p>
        <button className="button" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
