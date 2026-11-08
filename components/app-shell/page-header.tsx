import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Page actions, such as "Tambah transaksi" on desktop. */
  actions?: ReactNode;
};

/** The page's h1, a short description and its actions. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-[-0.01em] lg:text-3xl">
          {title}
        </h1>
        {description && <p className="text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
