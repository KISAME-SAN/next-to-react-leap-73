import { Card } from "@/components/ui/card";

export interface SlotItem { key: string; startTime: string; endTime: string; count: number }

export default function TeachersBlocksPicker({ slots, onSelect }: { slots: SlotItem[]; onSelect: (key: string) => void }) {
  if (!slots.length) return <p className="p-4 text-muted-foreground">Aucun créneau ce jour.</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {slots.map((s) => (
        <button key={s.key} onClick={() => onSelect(s.key)} className="text-left">
          <Card className="p-4 h-full border border-border hover:shadow-md transition-shadow hover-lift">
            <div className="font-semibold text-foreground">{s.startTime}–{s.endTime}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.count} prof(s)</div>
          </Card>
        </button>
      ))}
    </div>
  );
}
