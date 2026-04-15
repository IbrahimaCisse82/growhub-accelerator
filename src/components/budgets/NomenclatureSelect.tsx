import { useBudgetNomenclature, type NomenclatureItem } from "@/hooks/useBudgetNomenclature";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  value: string | null | undefined;
  onValueChange: (code: string) => void;
  placeholder?: string;
  className?: string;
  /** Only show leaf-level items (level 3) */
  leafOnly?: boolean;
}

export default function NomenclatureSelect({ value, onValueChange, placeholder = "Code Enabel", className, leafOnly = false }: Props) {
  const { data: items, isLoading } = useBudgetNomenclature();

  const filtered = leafOnly
    ? items?.filter(i => i.level >= 2) ?? []
    : items ?? [];

  // Group by parent for visual hierarchy
  const groups = new Map<string, NomenclatureItem[]>();
  filtered.forEach(item => {
    const parent = item.parent_code || "__root__";
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent)!.push(item);
  });

  return (
    <Select value={value || ""} onValueChange={onValueChange}>
      <SelectTrigger className={className || "w-full h-8 text-xs"}>
        <SelectValue placeholder={isLoading ? "Chargement…" : placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        <SelectItem value="__none__" className="text-xs text-muted-foreground">— Aucun —</SelectItem>
        {filtered.map(item => (
          <SelectItem
            key={item.code}
            value={item.code}
            className="text-xs"
          >
            <span style={{ paddingLeft: `${(item.level - 1) * 12}px` }} className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-primary font-semibold min-w-[40px]">{item.code}</span>
              <span className={item.level === 1 ? "font-bold" : item.level === 2 ? "font-medium" : ""}>{item.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
