import { Card } from "@/components/ui/card";

export interface TeacherItem { id: string; firstName: string; lastName: string }

export default function TeachersGrid({ teachers, onSelect }: { teachers: TeacherItem[]; onSelect: (id: string) => void }) {
  if (!teachers?.length) return <p className="p-4 text-muted-foreground">Aucun professeur disponible.</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {teachers.map((t) => (
        <button key={t.id} onClick={() => onSelect(t.id)} className="text-left">
          <Card className="p-4 h-full border border-border hover:shadow-md transition-shadow hover-lift">
            <div className="text-lg font-semibold text-foreground">{t.firstName} {t.lastName}</div>
            <div className="text-sm text-muted-foreground mt-1">Sélectionner</div>
          </Card>
        </button>
      ))}
    </div>
  );
}
