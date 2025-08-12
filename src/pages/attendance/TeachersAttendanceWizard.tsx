import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import TeachersGrid from "./components/TeachersGrid";
import MonthSelector from "./components/MonthSelector";
import TeachersMonthDaysGrid from "./components/TeachersMonthDaysGrid";
import BlocksPicker from "./components/BlocksPicker";
import TeachersSessionTable, { EntryValue, TeacherAttendanceStatus } from "./components/TeachersSessionTable";
import type { ScheduleBlock, Teacher, Class } from "./types";

const FR_DAYS = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"] as const;

interface TeacherAttendanceRecord { id: string; date: string; teacherId: string; scheduleBlockId: string; status: TeacherAttendanceStatus; comment?: string; createdAt: string }

export default function TeachersAttendanceWizard() {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schedules, setSchedules] = useState<ScheduleBlock[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    const savedTeachers = JSON.parse(localStorage.getItem("teachers") || "[]");
    const savedSchedules = JSON.parse(localStorage.getItem("schedules") || "[]");
    const savedClasses = JSON.parse(localStorage.getItem("classes") || "[]");
    setTeachers(savedTeachers);
    setSchedules(savedSchedules);
    setClasses(savedClasses);
  }, []);

  // Params
  const selectedTeacherId = params.get("teacher") || "";
  const month = params.get("month") || new Date().toISOString().slice(0,7);
  const day = params.get("day") || ""; // YYYY-MM-DD
  const blockId = params.get("block") || "";

  const setParam = (k: string, v?: string) => {
    const next = new URLSearchParams(params);
    if (!v) next.delete(k); else next.set(k, v);
    setParams(next, { replace: true });
  };
  const setParamsMany = (pairs: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(pairs).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, value);
    });
    setParams(next, { replace: true });
  };

  const dayName = useMemo(() => (day ? FR_DAYS[new Date(day).getDay()] : undefined), [day]);
  const dayBlocks = useMemo(() => {
    if (!selectedTeacherId || !dayName) return [] as ScheduleBlock[];
    return schedules.filter((b) => b.teacherId === selectedTeacherId && b.day === dayName);
  }, [schedules, selectedTeacherId, dayName]);

  // Entries state (single teacher)
  const [entries, setEntries] = useState<Record<string, EntryValue>>({});
  useEffect(() => {
    if (!selectedTeacherId || !blockId || !day) return;
    const saved: TeacherAttendanceRecord[] = JSON.parse(localStorage.getItem("teacherAttendanceRecords") || "[]");
    const rec = saved.find((r) => r.teacherId === selectedTeacherId && r.scheduleBlockId === blockId && r.date === day);
    if (rec) {
      setEntries({ [selectedTeacherId]: { status: rec.status, comment: rec.comment || "" } });
    } else {
      setEntries({});
    }
  }, [selectedTeacherId, blockId, day]);

  const onStatusChange = (teacherId: string, status: TeacherAttendanceStatus) => {
    setEntries((prev) => ({ ...prev, [teacherId]: { status, comment: prev[teacherId]?.comment || "" } }));
  };
  const onCommentChange = (teacherId: string, comment: string) => {
    setEntries((prev) => ({ ...prev, [teacherId]: { status: prev[teacherId]?.status || "aucun", comment } }));
  };

  const save = () => {
    if (!selectedTeacherId || !blockId || !day) {
      toast({ title: "Sélection requise", description: "Choisissez professeur, jour et séance." });
      return;
    }
    const payload: TeacherAttendanceRecord = {
      id: `${selectedTeacherId}-${blockId}-${day}`,
      date: day,
      teacherId: selectedTeacherId,
      scheduleBlockId: blockId,
      status: entries[selectedTeacherId]?.status || "aucun",
      comment: entries[selectedTeacherId]?.comment || "",
      createdAt: new Date().toISOString(),
    };
    const saved: TeacherAttendanceRecord[] = JSON.parse(localStorage.getItem("teacherAttendanceRecords") || "[]");
    const idx = saved.findIndex((r) => r.id === payload.id);
    if (idx >= 0) saved[idx] = payload; else saved.push(payload);
    localStorage.setItem("teacherAttendanceRecords", JSON.stringify(saved));
    toast({ title: "Présence enregistrée", description: "Les données ont été sauvegardées." });
  };

  const canonical = typeof window !== "undefined" ? window.location.href : undefined;

  // Clear invalid or stale block when changing day/teacher
  useEffect(() => {
    if (!blockId) return;
    if (!day || !selectedTeacherId) return;
    const exists = dayBlocks.some((b) => b.id === blockId);
    if (!exists) setParam('block');
  }, [blockId, day, selectedTeacherId, dayBlocks]);

  // Auto-select single block
  useEffect(() => {
    if (day && selectedTeacherId && dayBlocks.length === 1) setParam("block", dayBlocks[0].id);
  }, [day, selectedTeacherId, dayBlocks]);


  return (
    <main className="min-h-[60vh] p-2 md:p-4 animate-fade-in">
      <SEO
        title="Présence des Professeurs — École Manager"
        description="Flux multi-étapes: professeur → mois → jour → séance → relevé des présences."
        canonical={canonical}
        jsonLd={{ '@context': 'https://schema.org', '@type': 'WebPage', name: 'Présence des Professeurs' }}
      />

      <header className="mb-6 flex items-start gap-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Présence des Professeurs</h1>
          <p className="text-muted-foreground mt-1">Sélectionnez un professeur, un mois, un jour puis la séance.</p>
        </div>
      </header>


      {/* Step 1: Teachers grid */}
      {!selectedTeacherId && (
        <section className="bg-card rounded-lg shadow-sm border border-border p-4">
          <TeachersGrid teachers={teachers} onSelect={(id) => { setParamsMany({ teacher: id, month }); }} />
        </section>
      )}

      {/* Step 2: Month and days for selected teacher */}
      {selectedTeacherId && !day && (
        <section className="bg-card rounded-lg shadow-sm border border-border p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <MonthSelector value={month} onChange={(v) => { setParam('month', v); }} />
            <Button variant="outline" onClick={() => { setParamsMany({ teacher: undefined, day: undefined, block: undefined }); }}>Changer de professeur</Button>
          </div>
          <TeachersMonthDaysGrid month={month} teacherId={selectedTeacherId} schedules={schedules} classes={classes} specials={[]} lockFutureDays={false} onSelectDay={(d) => setParam('day', d)} />
        </section>
      )}

      {/* Step 3: Blocks of the selected day for this teacher */}
      {selectedTeacherId && day && !blockId && (
        <section className="bg-card rounded-lg shadow-sm border border-border p-4 space-y-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Professeur:</span>
            <span className="font-medium text-foreground">{(() => { const t = teachers.find(x=>x.id===selectedTeacherId); return t ? `${t.firstName} ${t.lastName}` : 'Professeur'; })()}</span>
            <span>•</span>
            <span>Jour:</span>
            <span className="font-medium text-foreground">{new Date(day).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'short' })}</span>
            <Button variant="outline" className="ml-auto" onClick={() => setParam('day')}>Changer de jour</Button>
          </div>
          <BlocksPicker blocks={dayBlocks} teachers={teachers} onSelect={(id) => setParam('block', id)} />
        </section>
      )}

      {/* Step 4: Single-teacher table */}
      {selectedTeacherId && day && blockId && (
        <section className="bg-card rounded-lg shadow-sm border border-border p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>Professeur:</span>
            <span className="font-medium text-foreground">{(() => { const t = teachers.find(x=>x.id===selectedTeacherId); return t ? `${t.firstName} ${t.lastName}` : 'Professeur'; })()}</span>
            <span>• Jour:</span>
            <span className="font-medium text-foreground">{new Date(day).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'short' })}</span>
            <span>• Séance:</span>
            <span className="font-medium text-foreground">{(() => { const b = dayBlocks.find(x=>x.id===blockId); return b ? `${b.subject} ${b.startTime}–${b.endTime}` : 'Séance'; })()}</span>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={() => setParam('block')}>Changer de séance</Button>
              <Button variant="outline" onClick={() => setParam('day')}>Changer de jour</Button>
            </div>
          </div>

          <TeachersSessionTable
            teachers={teachers.filter(t=>t.id===selectedTeacherId)}
            entries={entries}
            onStatusChange={onStatusChange}
            onCommentChange={onCommentChange}
          />

          <div className="pt-2">
            <Button onClick={save}>Enregistrer</Button>
          </div>
        </section>
      )}
    </main>
  );
}
