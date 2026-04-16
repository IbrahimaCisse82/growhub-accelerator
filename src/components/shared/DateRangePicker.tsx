import { useState } from "react";
import GhButton from "@/components/shared/GhButton";
import { CalendarDays } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DateRangePickerProps {
  from: Date | null;
  to: Date | null;
  onChange: (from: Date | null, to: Date | null) => void;
}

const presets = [
  { label: "7 jours", days: 7 },
  { label: "30 jours", days: 30 },
  { label: "90 jours", days: 90 },
  { label: "6 mois", days: 180 },
  { label: "12 mois", days: 365 },
  { label: "Tout", days: 0 },
];

export default function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(from ? format(from, "yyyy-MM-dd") : "");
  const [customTo, setCustomTo] = useState(to ? format(to, "yyyy-MM-dd") : "");

  const applyPreset = (days: number) => {
    if (days === 0) {
      onChange(null, null);
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      onChange(start, end);
    }
    setOpen(false);
  };

  const applyCustom = () => {
    const f = customFrom ? new Date(customFrom) : null;
    const t = customTo ? new Date(customTo) : null;
    onChange(f, t);
    setOpen(false);
  };

  const label = from && to
    ? `${format(from, "dd MMM yy", { locale: fr })} — ${format(to, "dd MMM yy", { locale: fr })}`
    : from
    ? `Depuis ${format(from, "dd MMM yy", { locale: fr })}`
    : "Toute période";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg border border-border bg-surface-2 text-foreground hover:bg-secondary transition-colors">
          <CalendarDays size={13} className="text-muted-foreground" />
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] bg-card border-border p-3 space-y-3" align="end">
        <div className="text-[11px] font-medium text-muted-foreground uppercase">Période rapide</div>
        <div className="grid grid-cols-3 gap-1.5">
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.days)}
              className="text-[11px] px-2 py-1.5 rounded-lg bg-surface-2 border border-border text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="border-t border-border pt-3 space-y-2">
          <div className="text-[11px] font-medium text-muted-foreground uppercase">Personnalisé</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground block mb-0.5">Du</label>
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] text-foreground"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-0.5">Au</label>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] text-foreground"
              />
            </div>
          </div>
          <GhButton size="sm" onClick={applyCustom} className="w-full">Appliquer</GhButton>
        </div>
      </PopoverContent>
    </Popover>
  );
}
