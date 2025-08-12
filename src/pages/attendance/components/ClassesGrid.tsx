import { Card } from "@/components/ui/card";

export interface ClassItem { id: string; name: string }

export default function ClassesGrid({ classes, onSelect }: { classes: ClassItem[]; onSelect: (id: string) => void }) {
  if (!classes?.length) return <p className="p-4 text-muted-foreground">Aucune classe disponible.</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {classes.map((c) => (
        <button key={c.id} onClick={() => onSelect(c.id)} className="text-left">
          <Card className="p-4 h-full border border-border hover:shadow-md transition-shadow hover-lift">
            <div className="text-lg font-semibold text-foreground">{c.name}</div>
            <div className="text-sm text-muted-foreground mt-1">Sélectionner</div>
          </Card>
        </button>
      ))}
    </div>
  );
}
