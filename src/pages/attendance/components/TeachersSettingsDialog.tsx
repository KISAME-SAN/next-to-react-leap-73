import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useMemo, useState } from "react";

export type SpecialDayType = 'holiday' | 'celebration';
export interface SpecialDay { id: string; date: string; type: SpecialDayType; appliesToAll: boolean; classIds?: string[] }
export interface AttendanceSettings { lockFutureDays: boolean; specials: SpecialDay[] }
export interface Class { id: string; name: string }

export default function TeachersSettingsDialog({ open, onOpenChange, settings, onChange, classes }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AttendanceSettings;
  onChange: (next: AttendanceSettings) => void;
  classes: Class[];
}) {
  const [date, setDate] = useState("");
  const [type, setType] = useState<SpecialDayType>('holiday');
  const [appliesToAll, setAppliesToAll] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  const addSpecial = () => {
    if (!date) return;
    const id = `${type}-${date}-${Date.now()}`;
    const entry: SpecialDay = { id, date, type, appliesToAll, classIds: appliesToAll ? [] : selectedClasses };
    onChange({ ...settings, specials: [...settings.specials, entry] });
    setDate("");
    setSelectedClasses([]);
    setAppliesToAll(true);
    setType('holiday');
  };

  const removeSpecial = (id: string) => {
    onChange({ ...settings, specials: settings.specials.filter((s) => s.id !== id) });
  };

  const typeLabel = (t: SpecialDayType) => (t === 'holiday' ? 'Férié' : 'Fête');

  const sortedSpecials = useMemo(() => {
    return [...settings.specials].sort((a, b) => a.date.localeCompare(b.date));
  }, [settings.specials]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Paramètres des présences</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <section>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-foreground">Verrouillage des jours futurs</div>
                <div className="text-sm text-muted-foreground">Exiger un double-clic (&lt; 6s) pour ouvrir un jour futur.</div>
              </div>
              <Switch checked={settings.lockFutureDays} onCheckedChange={(v) => onChange({ ...settings, lockFutureDays: v })} />
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <div className="font-medium text-foreground">Jours spéciaux</div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label htmlFor="date">Date</Label>
                <input id="date" type="date" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <select id="type" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" value={type} onChange={(e) => setType(e.target.value as SpecialDayType)}>
                  <option value="holiday">Férié</option>
                  <option value="celebration">Fête</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <Switch id="all" checked={appliesToAll} onCheckedChange={(v) => setAppliesToAll(v)} />
                <Label htmlFor="all">S'applique à toutes les classes</Label>
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={addSpecial} disabled={!date}>Ajouter</Button>
              </div>
            </div>

            {!appliesToAll && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-auto border rounded-md p-3 bg-card">
                {classes.map((c) => {
                  const checked = selectedClasses.includes(c.id);
                  return (
                    <label key={c.id} className="flex items-center gap-2 text-sm text-foreground">
                      <Checkbox checked={checked} onCheckedChange={(v) => {
                        const isChecked = Boolean(v);
                        setSelectedClasses((prev) => isChecked ? [...prev, c.id] : prev.filter((x) => x !== c.id));
                      }} />
                      <span>{c.name}</span>
                    </label>
                  );
                })}
              </div>
            )}

            <div className="space-y-2">
              {sortedSpecials.length === 0 ? (
                <div className="text-sm text-muted-foreground">Aucun jour spécial défini.</div>
              ) : (
                <div className="space-y-2">
                  {sortedSpecials.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
                      <div className="text-sm text-foreground">
                        <span className="font-medium">{s.date}</span> — {typeLabel(s.type)} — {s.appliesToAll ? "Toutes les classes" : `${s.classIds?.length || 0} classe(s)`}
                      </div>
                      <Button variant="outline" onClick={() => removeSpecial(s.id)}>Supprimer</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
