export default function MonthSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-muted-foreground">Mois</label>
      <input
        type="month"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 border border-input rounded-md bg-background"
      />
    </div>
  );
}
