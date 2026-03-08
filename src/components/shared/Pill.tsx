interface PillProps {
  children: React.ReactNode;
  color: "green" | "blue" | "amber" | "purple" | "rose" | "gray";
}

const colorMap = {
  green: "bg-gh-green/12 text-gh-green",
  blue: "bg-gh-blue/12 text-gh-blue",
  amber: "bg-gh-amber/12 text-gh-amber",
  purple: "bg-gh-purple/12 text-gh-purple",
  rose: "bg-gh-rose/12 text-gh-rose",
  gray: "bg-muted text-muted-foreground",
};

export default function Pill({ children, color }: PillProps) {
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-2 py-[3px] rounded-full whitespace-nowrap ${colorMap[color]}`}>
      {children}
    </span>
  );
}
