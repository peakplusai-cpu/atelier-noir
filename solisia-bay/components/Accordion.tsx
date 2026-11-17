import type { ReactNode } from "react";

export function Accordion({ children }: { children: ReactNode }) {
  return <div className="accordion">{children}</div>;
}

export function AccordionItem({
  title,
  children,
  defaultOpen,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="acc-item" open={defaultOpen}>
      <summary>
        <span>{title}</span>
        <span className="acc-icon" aria-hidden />
      </summary>
      <div className="acc-body">{children}</div>
    </details>
  );
}
