import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  description: string;
  chip?: { label: string; value: string };
  children?: ReactNode;
}

export default function SectionCard({
  title,
  description,
  chip,
  children,
}: SectionCardProps) {
  return (
    <section className="rounded-3xl bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
          <p className="mt-1.5 text-sm text-muted">{description}</p>
        </div>
        {chip && (
          <div className="shrink-0 rounded-xl bg-soft px-4 py-2.5 text-right">
            <p className="text-xs font-semibold">{chip.label}</p>
            <p className="mt-0.5 text-xs text-muted">{chip.value}</p>
          </div>
        )}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </section>
  );
}
