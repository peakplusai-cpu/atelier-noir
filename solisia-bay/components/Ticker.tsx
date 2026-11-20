const WORDS = ["SKATE", "BREAK", "SELECT", "CLACK", "SESSION"];

export function Ticker() {
  const run = (copy: string) =>
    WORDS.map((word) => (
      <span key={`${copy}-${word}`}>
        {word}
        <b aria-hidden="true">·</b>
      </span>
    ));
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {run("a")}
        {run("b")}
        {run("c")}
        {run("d")}
      </div>
    </div>
  );
}
