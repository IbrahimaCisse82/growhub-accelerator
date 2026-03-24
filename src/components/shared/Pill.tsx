interface PillProps {
  children: React.ReactNode;
  color: "green" | "blue" | "amber" | "purple" | "rose" | "gray";
}

const colorMap = {
  green: "bg-gh-green/12 text-gh-green border border-gh-green/25",
  blue: "bg-gh-blue/12 text-gh-blue border border-gh-blue/25",
  amber: "bg-gh-amber/12 text-gh-amber border border-gh-amber/25",
  purple: "bg-gh-purple/12 text-gh-purple border border-gh-purple/25",
  rose: "bg-gh-rose/12 text-gh-rose border border-gh-rose/25",
  gray: "bg-muted text-muted-foreground border border-border",
};

export default function Pill({ children, color }: PillProps) {
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-2 py-[3px] rounded-full whitespace-nowrap ${colorMap[color]}`}>
      {children}
    </span>
  );
}
