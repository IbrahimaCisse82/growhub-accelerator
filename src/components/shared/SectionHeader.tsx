import { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}

export default function SectionHeader({ title, subtitle, actions }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-5 ui-panel p-3.5">
      <div>
        <h1 className="font-display text-[20px] md:text-[22px] font-extrabold text-foreground leading-tight">{title}</h1>
        <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>
      </div>
      {actions && <div className="flex gap-2 items-center flex-wrap">{actions}</div>}
    </div>
  );
}
