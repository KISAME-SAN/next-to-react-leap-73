import { Card } from "@/components/ui/card";

export interface Teacher { id: string; firstName: string; lastName: string }
export interface ScheduleBlock { id: string; day: string; classId: string; startTime: string; endTime: string; subject: string; teacherId: string }

export default function BlocksPicker({ blocks, teachers, onSelect }: {
  blocks: ScheduleBlock[];
  teachers: Teacher[];
  onSelect: (blockId: string) => void;
}) {
  const getTeacherName = (id: string) => {
    const t = teachers.find((x) => x.id === id);
    return t ? `${t.firstName} ${t.lastName}` : "Professeur";
  };
  if (!blocks.length) return <p className="p-4 text-muted-foreground">Aucune séance ce jour.</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {blocks.map((b) => (
        <button key={b.id} onClick={() => onSelect(b.id)} className="text-left">
          <Card className="p-4 border border-border hover:shadow-md transition-shadow">
            <div className="font-semibold text-foreground">{b.subject}</div>
            <div className="text-sm text-muted-foreground">{b.startTime}–{b.endTime}</div>
            <div className="text-xs text-muted-foreground mt-1">{getTeacherName(b.teacherId)}</div>
          </Card>
        </button>
      ))}
    </div>
  );
}
