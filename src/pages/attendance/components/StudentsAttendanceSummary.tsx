import { cn } from "@/lib/utils";

interface Props {
  present: number;
  absent: number;
  retard: number;
  renvoi: number;
  total: number;
}

export default function StudentsAttendanceSummary({ present, absent, retard, renvoi, total }: Props) {
  const percent = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  return (
    <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-5 gap-3">
      <SummaryItem label="Total" value={total} className="md:col-span-1" />
      <SummaryItem label="Présents" value={`${present} (${percent(present)}%)`} />
      <SummaryItem label="Absents" value={`${absent} (${percent(absent)}%)`} />
      <SummaryItem label="Retards" value={`${retard} (${percent(retard)}%)`} />
      <SummaryItem label="Renvois" value={`${renvoi} (${percent(renvoi)}%)`} />
    </div>
  );
}

function SummaryItem({ label, value, className }: { label: string; value: number | string; className?: string }) {
  return (
    <div className={cn("rounded-md border border-border bg-card p-3", className)}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}
