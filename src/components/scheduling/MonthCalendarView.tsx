import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isAfter } from "date-fns";
import { fr } from "date-fns/locale";
import GhCard from "@/components/shared/GhCard";
import BookSlotDialog from "./BookSlotDialog";

interface MonthCalendarViewProps {
  currentMonth: Date;
  availableSlots: any[];
  getMentorName: (id: string) => string;
  userId?: string;
}

export default function MonthCalendarView({ currentMonth, availableSlots, getMentorName, userId }: MonthCalendarViewProps) {
  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const rows: Date[][] = [];
    let day = calStart;
    while (day <= calEnd) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(day);
        day = addDays(day, 1);
      }
      rows.push(week);
    }
    return rows;
  }, [currentMonth]);

  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <GhCard title={`Calendrier — ${format(currentMonth, "MMMM yyyy", { locale: fr })}`} noPadding>
      <div className="grid grid-cols-7 border-b border-border">
        {dayNames.map(d => (
          <div key={d} className="text-center py-2 text-[10px] font-mono uppercase text-muted-foreground border-r border-border last:border-r-0">{d}</div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-border last:border-b-0">
          {week.map(day => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const daySlots = availableSlots.filter(s => isSameDay(new Date(s.start_at), day));
            return (
              <div key={day.toISOString()} className={`min-h-[80px] border-r border-border last:border-r-0 p-1 ${!isCurrentMonth ? "bg-muted/20" : ""}`}>
                <div className={`text-[11px] font-mono mb-0.5 ${isToday ? "text-primary font-bold" : isCurrentMonth ? "text-foreground" : "text-muted-foreground/50"}`}>
                  {format(day, "d")}
                </div>
                {daySlots.slice(0, 3).map(slot => (
                  <div key={slot.id} className="bg-primary/5 border border-primary/20 rounded px-1 py-0.5 mb-0.5">
                    <div className="text-[9px] font-mono text-primary font-semibold">
                      {format(new Date(slot.start_at), "HH:mm")}
                    </div>
                    <div className="text-[8px] text-foreground truncate">{getMentorName(slot.mentor_id)}</div>
                    {slot.mentor_id !== userId && (
                      <BookSlotDialog slot={slot} mentorName={getMentorName(slot.mentor_id)} />
                    )}
                  </div>
                ))}
                {daySlots.length > 3 && (
                  <div className="text-[8px] text-muted-foreground text-center">+{daySlots.length - 3}</div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </GhCard>
  );
}
