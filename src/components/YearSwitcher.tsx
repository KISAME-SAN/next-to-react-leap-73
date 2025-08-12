import { useEffect, useMemo, useState } from "react";
import { listYears, addYear, getActiveYearId, setActiveYear, AcademicYear } from "@/lib/years";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { cloneYearData } from "@/lib/yearClone";
export default function YearSwitcher({ compact = false }: { compact?: boolean }) {
  const [years, setYears] = useState<AcademicYear[]>(() => listYears());
  const [active, setActive] = useState<string>(() => getActiveYearId());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "activeYearId" || e.key === "academicYears") {
        setYears(listYears());
        setActive(getActiveYearId());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const label = useMemo(() => years.find((y) => y.id === active)?.nom ?? active, [years, active]);

  const handleAdd = () => {
    const last = years[years.length - 1];
    let start = new Date();
    if (last) {
      const endYear = Number(last.id.split("-")[1]);
      start = new Date(`${endYear}-09-01`);
    }
    const sy = start.getFullYear();
    const ey = sy + 1;
    const y = addYear({ id: `${sy}-${ey}`, nom: `Année scolaire ${sy}-${ey}`, debut: `${sy}-09-01`, fin: `${ey}-08-31` });

    // Clone all per-year configurations from previous year, excluding students/profs data
    try {
      if (last) {
        cloneYearData(last.id, y.id);
      }
    } catch {}


    setYears(listYears());
    setActiveYear(y.id);
    setActive(y.id);
  };

  return (
    <div className={compact ? "flex items-center gap-2" : "space-y-2"}>
      {!compact && <p className="text-sm text-muted-foreground">Année active</p>}
      <div className="flex items-center gap-2">
        <Select value={active} onValueChange={(v)=>{ setActive(v); setTimeout(()=>setActiveYear(v), 0); }}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Choisir une année" />
          </SelectTrigger>
          <SelectContent className="z-50 max-h-64">
            {years.map((y)=> (
              <SelectItem key={y.id} value={y.id}>{y.nom}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={handleAdd}>Nouvelle année</Button>
      </div>
      {compact && <span className="sr-only">{label}</span>}
    </div>
  );
}
