import type { ReactNode } from "react";

export function SectionHeader({
  title,
  caption,
}: {
  title: string;
  caption?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {title}
      </h2>
      {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
    </div>
  );
}

export function KioskShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-4">
          <span className="inline-block size-2 rounded-full bg-primary" />
          <span className="text-base font-semibold tracking-tight text-foreground">
            Gym kiosk
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pt-6 pb-16">{children}</main>
    </div>
  );
}
