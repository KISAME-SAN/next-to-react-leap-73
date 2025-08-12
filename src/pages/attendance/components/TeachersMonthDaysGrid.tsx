import { eachDayOfInterval, endOfMonth, format, startOfMonth } from "date-fns";
import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const FR_DAYS = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"] as const;

export interface ScheduleBlock { id: string; day: string; classId: string; startTime: string; endTime: string; subject: string; teacherId: string }
export interface Class { id: string; name: string }
export type SpecialDayType = 'holiday' | 'celebration';
export interface SpecialDay { id: string; date: string; type: SpecialDayType; appliesToAll: boolean; classIds?: string[] }

export default function TeachersMonthDaysGrid({ month, teacherId, schedules, classes, specials, lockFutureDays, onSelectDay }: {
  month: string; // YYYY-MM
  teacherId: string;
  schedules: ScheduleBlock[];
  classes: Class[];
  specials: SpecialDay[];
  lockFutureDays: boolean;
  onSelectDay: (dateStr: string) => void;
}) {
  const start = startOfMonth(new Date(`${month}-01`));
  const end = endOfMonth(start);
  const days = eachDayOfInterval({ start, end });
  const { toast } = useToast();

  const lastClickRef = useRef<{ iso: string; ts: number } | null>(null);

  const today = new Date();
  today.setHours(0,0,0,0);

  const countForDate = (d: Date) => {
    const dayName = FR_DAYS[d.getDay()];
    const iso = format(d, "yyyy-MM-dd");
    const dayBlocks = schedules.filter((b) => b.teacherId === teacherId && b.day === dayName);
    if (dayBlocks.length === 0) return 0;

    const specialsForDay = specials.filter((s) => s.date === iso);
    if (specialsForDay.some((s) => s.appliesToAll)) return 0;

    const affectedClassIds = new Set<string>();
    specialsForDay.forEach((s) => s.classIds?.forEach((id) => affectedClassIds.add(id)));

    // Count only blocks whose class is NOT affected
    const effective = dayBlocks.filter((b) => !affectedClassIds.has(b.classId));
    return effective.length;
  };

  const isSpecialForTeacher = (d: Date) => {
    const iso = format(d, "yyyy-MM-dd");
    const specialsForDay = specials.filter((s) => s.date === iso);
    if (specialsForDay.length === 0) return false;
    if (specialsForDay.some((s) => s.appliesToAll)) return true;
    // Check if any of teacher's classes that day are affected
    const dayName = FR_DAYS[d.getDay()];
    const classIds = new Set(schedules.filter((b) => b.teacherId === teacherId && b.day === dayName).map((b) => b.classId));
    return specialsForDay.some((s) => s.classIds?.some((id) => classIds.has(id)));
  };

  const handleDayClick = (d: Date) => {
    const iso = format(d, "yyyy-MM-dd");
    const isFuture = d.getTime() > today.getTime();
    if (lockFutureDays && isFuture) {
      const now = Date.now();
      if (lastClickRef.current && lastClickRef.current.iso === iso && now - lastClickRef.current.ts <= 6000) {
        lastClickRef.current = null;
        onSelectDay(iso);
      } else {
        lastClickRef.current = { iso, ts: now };
        toast({ title: "Jour futur verrouillé", description: "Double-cliquez à nouveau dans les 6s pour confirmer." });
      }
      return;
    }
    onSelectDay(iso);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {days.map((d) => {
        const iso = format(d, "yyyy-MM-dd");
        const count = countForDate(d);
        const special = isSpecialForTeacher(d);
        return (
          <button key={iso} onClick={() => handleDayClick(d)} className="text-left">
            <div className={`p-3 rounded-md border ${special ? 'border-[hsl(var(--destructive))]' : 'border-border'} bg-card hover:bg-muted/40 transition-colors`}>
              <div className="text-sm font-medium text-foreground">{format(d, "d MMM")}</div>
              <div className="text-xs text-muted-foreground mt-1">{count} cours</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
