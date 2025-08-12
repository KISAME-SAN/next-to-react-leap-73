import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ClassesGrid from "./components/ClassesGrid";
import MonthSelector from "./components/MonthSelector";
import MonthDaysGrid from "./components/MonthDaysGrid";
import BlocksPicker from "./components/BlocksPicker";
import StudentsSessionTable, { EntryValue } from "./components/StudentsSessionTable";
import type { AttendanceStatus, AttendanceEntry, AttendanceRecord, Class, ScheduleBlock, Student, Teacher } from "./types";

const FR_DAYS = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"] as const;

export default function StudentsAttendanceWizard() {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();

  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<(Student & { birthDate?: string })[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schedules, setSchedules] = useState<ScheduleBlock[]>([]);

  // Load storage
  useEffect(() => {
    const savedClasses = JSON.parse(localStorage.getItem("classes") || "[]");
    const savedStudents = JSON.parse(localStorage.getItem("students") || "[]");
    const savedTeachers = JSON.parse(localStorage.getItem("teachers") || "[]");
    const savedSchedules = JSON.parse(localStorage.getItem("schedules") || "[]");
    setClasses(savedClasses);
    setStudents(savedStudents);
    setTeachers(savedTeachers);
    setSchedules(savedSchedules);
  }, []);

  // Params
  const selectedClassId = params.get("class") || "";
  const month = params.get("month") || new Date().toISOString().slice(0,7); // YYYY-MM
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

  const classStudents = useMemo(() => students.filter((s) => s.classId === selectedClassId), [students, selectedClassId]);

  const dayName = useMemo(() => (day ? FR_DAYS[new Date(day).getDay()] : undefined), [day]);
  const dayBlocks = useMemo(() => {
    if (!selectedClassId || !dayName) return [] as ScheduleBlock[];
    return schedules.filter((b) => b.classId === selectedClassId && b.day === dayName);
  }, [schedules, selectedClassId, dayName]);

  // Entries state
  const [entries, setEntries] = useState<Record<string, EntryValue>>({});
  useEffect(() => {
    if (!selectedClassId || !blockId || !day) return;
    const saved: AttendanceRecord[] = JSON.parse(localStorage.getItem("attendanceRecords") || "[]");
    const rec = saved.find((r) => r.classId === selectedClassId && r.scheduleBlockId === blockId && r.date === day);
    if (rec) {
      const map: Record<string, EntryValue> = {};
      rec.entries.forEach((e) => { map[e.studentId] = { status: e.status, comment: e.comment || "" }; });
      setEntries(map);
    } else {
      setEntries({});
    }
  }, [selectedClassId, blockId, day]);

  const onStatusChange = (studentId: string, status: AttendanceStatus) => {
    setEntries((prev) => ({ ...prev, [studentId]: { status, comment: prev[studentId]?.comment || "" } }));
  };
  const onCommentChange = (studentId: string, comment: string) => {
    setEntries((prev) => ({ ...prev, [studentId]: { status: prev[studentId]?.status || "present", comment } }));
  };

  const save = () => {
    if (!selectedClassId || !blockId || !day) {
      toast({ title: "Sélection requise", description: "Choisissez classe, jour et séance." });
      return;
    }
    const payload: AttendanceRecord = {
      id: `${selectedClassId}-${blockId}-${day}`,
      date: day,
      classId: selectedClassId,
      scheduleBlockId: blockId,
      entries: classStudents.map<AttendanceEntry>((s) => ({
        studentId: s.id,
        status: entries[s.id]?.status || "present",
        comment: entries[s.id]?.comment || "",
      })),
      createdAt: new Date().toISOString(),
    };
    const saved: AttendanceRecord[] = JSON.parse(localStorage.getItem("attendanceRecords") || "[]");
    const idx = saved.findIndex((r) => r.id === payload.id);
    if (idx >= 0) saved[idx] = payload; else saved.push(payload);
    localStorage.setItem("attendanceRecords", JSON.stringify(saved));
    toast({ title: "Présences enregistrées", description: "Les données ont été sauvegardées." });
  };

  const canonical = typeof window !== "undefined" ? window.location.href : undefined;

  // Clear invalid or stale block when changing day/class
  useEffect(() => {
    if (!blockId) return;
    if (!day || !selectedClassId) return;
    const exists = dayBlocks.some((b) => b.id === blockId);
    if (!exists) setParam('block');
  }, [blockId, day, selectedClassId, dayBlocks]);

  // Auto-select single block
  useEffect(() => {
    if (day && selectedClassId && dayBlocks.length === 1) setParam("block", dayBlocks[0].id);
  }, [day, selectedClassId, dayBlocks]);

  return (
    <main className="min-h-[60vh] p-2 md:p-4 animate-fade-in">
      <SEO
        title="Présence des Élèves — École Manager"
        description="Flux multi-étapes: classe → mois → jour → séance → relevé des présences."
        canonical={canonical}
        jsonLd={{ '@context': 'https://schema.org', '@type': 'WebPage', name: 'Présence des Élèves' }}
      />

      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Présence des Élèves</h1>
        <p className="text-muted-foreground mt-1">Sélectionnez une classe, un mois, un jour puis la séance.</p>
      </header>

      {/* Step 1: Classes grid */}
      {!selectedClassId && (
        <section className="bg-card rounded-lg shadow-sm border border-border p-4">
          <ClassesGrid classes={classes} onSelect={(id) => { setParamsMany({ class: id, month }); }} />
        </section>
      )}

      {/* Step 2: Month and days */}
      {selectedClassId && !day && (
        <section className="bg-card rounded-lg shadow-sm border border-border p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <MonthSelector value={month} onChange={(v) => { setParam('month', v); }} />
            <Button variant="outline" onClick={() => { setParamsMany({ class: undefined, day: undefined, block: undefined }); }}>Changer de classe</Button>
          </div>
          <MonthDaysGrid month={month} classId={selectedClassId} schedules={schedules} onSelectDay={(d) => setParam('day', d)} />
        </section>
      )}

      {/* Step 3: Blocks of the selected day */}
      {selectedClassId && day && !blockId && (
        <section className="bg-card rounded-lg shadow-sm border border-border p-4 space-y-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Classe choisie:</span>
            <span className="font-medium text-foreground">{classes.find(c=>c.id===selectedClassId)?.name || 'Classe'}</span>
            <span>•</span>
            <span>Jour:</span>
            <span className="font-medium text-foreground">{new Date(day).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'short' })}</span>
            <Button variant="outline" className="ml-auto" onClick={() => setParam('day')}>Changer de jour</Button>
          </div>
          <BlocksPicker blocks={dayBlocks} teachers={teachers} onSelect={(id) => setParam('block', id)} />
        </section>
      )}

      {/* Step 4: Students table */}
      {selectedClassId && day && blockId && (
        <section className="bg-card rounded-lg shadow-sm border border-border p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>Classe:</span>
            <span className="font-medium text-foreground">{classes.find(c=>c.id===selectedClassId)?.name || 'Classe'}</span>
            <span>• Jour:</span>
            <span className="font-medium text-foreground">{new Date(day).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'short' })}</span>
            <span>• Séance:</span>
            <span className="font-medium text-foreground">{(() => { const b = dayBlocks.find(x=>x.id===blockId); return b ? `${b.subject} ${b.startTime}–${b.endTime}` : 'Séance'; })()}</span>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={() => setParam('block')}>Changer de séance</Button>
              <Button variant="outline" onClick={() => setParam('day')}>Changer de jour</Button>
            </div>
          </div>

          <StudentsSessionTable
            students={classStudents}
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
