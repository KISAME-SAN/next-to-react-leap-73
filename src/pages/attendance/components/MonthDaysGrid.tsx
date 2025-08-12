import { eachDayOfInterval, endOfMonth, format, startOfMonth } from "date-fns";

const FR_DAYS = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"] as const;

export interface ScheduleBlock { id: string; day: string; classId: string; startTime: string; endTime: string; subject: string; teacherId: string }

export default function MonthDaysGrid({ month, classId, schedules, onSelectDay }: {
  month: string; // YYYY-MM
  classId: string;
  schedules: ScheduleBlock[];
  onSelectDay: (dateStr: string) => void;
}) {
  const start = startOfMonth(new Date(`${month}-01`));
  const end = endOfMonth(start);
  const days = eachDayOfInterval({ start, end });

  const countForDate = (d: Date) => {
    const dayName = FR_DAYS[d.getDay()];
    return schedules.filter((b) => b.classId === classId && b.day === dayName).length;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {days.map((d) => {
        const iso = format(d, "yyyy-MM-dd");
        const count = countForDate(d);
        return (
          <button key={iso} onClick={() => onSelectDay(iso)} className="text-left">
            <div className="p-3 rounded-md border border-border bg-card hover:bg-muted/40 transition-colors">
              <div className="text-sm font-medium text-foreground">{format(d, "d MMM")}</div>
              <div className="text-xs text-muted-foreground mt-1">{count} cours</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
