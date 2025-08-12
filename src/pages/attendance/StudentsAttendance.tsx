import { useCallback, useEffect, useMemo, useState } from "react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import StudentsAttendanceToolbar from "./components/StudentsAttendanceToolbar";
import StudentsAttendanceSummary from "./components/StudentsAttendanceSummary";
import StudentsAttendanceTable, { EntryValue } from "./components/StudentsAttendanceTable";
import type { AttendanceStatus, Student, Class, Teacher, ScheduleBlock, AttendanceRecord, AttendanceEntry } from "./types";

export default function StudentsAttendance() {
  const { toast } = useToast();

  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schedules, setSchedules] = useState<ScheduleBlock[]>([]);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [selectedBlockId, setSelectedBlockId] = useState("");

  const [entries, setEntries] = useState<Record<string, EntryValue>>({});
  const [search, setSearch] = useState("");
  const [locked, setLocked] = useState(false);

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

  const dayName = useMemo(() => {
    const d = new Date(date);
    const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    return days[d.getDay()];
  }, [date]);

  const classStudents = useMemo(() => students.filter((s) => s.classId === selectedClassId), [students, selectedClassId]);
  const dayBlocks = useMemo(
    () => schedules.filter((b) => b.classId === selectedClassId && b.day === dayName),
    [schedules, selectedClassId, dayName]
  );
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return classStudents;
    return classStudents.filter((s) => `${s.firstName} ${s.lastName}`.toLowerCase().includes(q));
  }, [classStudents, search]);

  const getTeacherName = (teacherId: string) => {
    const t = teachers.find((t) => t.id === teacherId);
    return t ? `${t.firstName} ${t.lastName}` : "Professeur";
  };

  // Charger si un enregistrement existe
  useEffect(() => {
    if (!selectedClassId || !selectedBlockId || !date) return;
    const saved: AttendanceRecord[] = JSON.parse(localStorage.getItem("attendanceRecords") || "[]");
    const rec = saved.find((r) => r.classId === selectedClassId && r.scheduleBlockId === selectedBlockId && r.date === date);
    if (rec) {
      const map: Record<string, EntryValue> = {};
      rec.entries.forEach((e) => {
        map[e.studentId] = { status: e.status, comment: e.comment || "" };
      });
      setEntries(map);
      setLocked(!!rec.locked);
    } else {
      setEntries({});
      setLocked(false);
    }
  }, [selectedClassId, selectedBlockId, date]);

  const setAll = (status: AttendanceStatus) => {
    if (locked) return;
    const map: Record<string, EntryValue> = {};
    classStudents.forEach((s) => {
      map[s.id] = { status, comment: entries[s.id]?.comment || "" };
    });
    setEntries(map);
  };

  const onStatusChange = useCallback((studentId: string, status: AttendanceStatus) => {
    if (locked) return;
    setEntries((prev) => ({ ...prev, [studentId]: { status, comment: prev[studentId]?.comment || "" } }));
  }, [locked]);

  const onCommentChange = useCallback((studentId: string, comment: string) => {
    if (locked) return;
    setEntries((prev) => ({ ...prev, [studentId]: { status: prev[studentId]?.status || "present", comment } }));
  }, [locked]);

  const counts = useMemo(() => {
    const init = { present: 0, absent: 0, retard: 0, renvoi: 0 } as Record<AttendanceStatus, number>;
    classStudents.forEach((s) => {
      const st = entries[s.id]?.status || "present";
      init[st] += 1;
    });
    return init;
  }, [classStudents, entries]);

  const save = () => {
    if (!selectedClassId || !selectedBlockId) {
      toast({ title: "Sélection requise", description: "Sélectionnez une classe et une séance.", variant: "default" });
      return;
    }
    if (locked) {
      toast({ title: "Relevé verrouillé", description: "Déverrouillez avant de modifier/sauvegarder." });
      return;
    }
    const payload: AttendanceRecord = {
      id: `${selectedClassId}-${selectedBlockId}-${date}`,
      date,
      classId: selectedClassId,
      scheduleBlockId: selectedBlockId,
      entries: classStudents.map<AttendanceEntry>((s) => ({
        studentId: s.id,
        status: entries[s.id]?.status || "present",
        comment: entries[s.id]?.comment || "",
      })),
      createdAt: new Date().toISOString(),
      locked,
    };
    const saved: AttendanceRecord[] = JSON.parse(localStorage.getItem("attendanceRecords") || "[]");
    const idx = saved.findIndex((r) => r.id === payload.id);
    if (idx >= 0) saved[idx] = payload; else saved.push(payload);
    localStorage.setItem("attendanceRecords", JSON.stringify(saved));
    toast({ title: "Présences enregistrées", description: "Les données ont été sauvegardées." });
  };

  const toggleLock = () => {
    setLocked((v) => !v);
    if (selectedClassId && selectedBlockId) {
      const saved: AttendanceRecord[] = JSON.parse(localStorage.getItem("attendanceRecords") || "[]");
      const id = `${selectedClassId}-${selectedBlockId}-${date}`;
      const idx = saved.findIndex((r) => r.id === id);
      if (idx >= 0) {
        saved[idx].locked = !locked;
        localStorage.setItem("attendanceRecords", JSON.stringify(saved));
      }
    }
  };

  const exportCSV = () => {
    if (!selectedClassId || !selectedBlockId) {
      toast({ title: "Sélection requise", description: "Choisissez classe et séance avant d'exporter." });
      return;
    }
    const header = ["date","classId","scheduleBlockId","studentId","firstName","lastName","status","comment"];
    const rows = classStudents.map((s) => [
      date,
      selectedClassId,
      selectedBlockId,
      s.id,
      s.firstName,
      s.lastName,
      (entries[s.id]?.status || "present"),
      (entries[s.id]?.comment || "").replace(/"/g, '""'),
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c)}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${selectedClassId}_${selectedBlockId}_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export CSV prêt", description: "Téléchargement démarré." });
  };

  const canonical = typeof window !== "undefined" ? window.location.href : undefined;

  return (
    <main className="min-h-[60vh] p-2 md:p-4 animate-fade-in">
      <SEO
        title="Présence des Élèves — École Manager"
        description="Enregistrez présence, absence, retard et renvoi par classe et séance."
        canonical={canonical}
        jsonLd={{ '@context': 'https://schema.org', '@type': 'WebPage', name: 'Présence des Élèves' }}
      />

      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Présence des Élèves</h1>
        <p className="text-muted-foreground mt-1">Sélectionnez une classe, une date et une séance du jour.</p>
        {selectedBlockId && (
          <p className="text-xs text-muted-foreground mt-1">{(() => {
            const b = dayBlocks.find((x) => x.id === selectedBlockId);
            if (!b) return null;
            return `${b.subject} — ${b.startTime}–${b.endTime} • ${getTeacherName(b.teacherId)}`;
          })()}</p>
        )}
      </header>

      <section className="bg-card rounded-lg shadow-sm border border-border mb-6">
        <StudentsAttendanceToolbar
          classes={classes}
          selectedClassId={selectedClassId}
          onChangeClass={(id) => { setSelectedClassId(id); setSelectedBlockId(""); }}
          date={date}
          onChangeDate={setDate}
          dayBlocks={dayBlocks}
          selectedBlockId={selectedBlockId}
          onChangeBlock={setSelectedBlockId}
          onSetAll={setAll}
          searchTerm={search}
          onChangeSearch={setSearch}
          locked={locked}
          onToggleLock={toggleLock}
          onExportCSV={exportCSV}
        />

        {selectedClassId && (
          <div className="border-t border-border">
            <StudentsAttendanceSummary
              present={counts.present}
              absent={counts.absent}
              retard={counts.retard}
              renvoi={counts.renvoi}
              total={classStudents.length}
            />

            {classStudents.length === 0 ? (
              <p className="px-4 pb-4 text-muted-foreground">Aucun élève trouvé pour cette classe.</p>
            ) : (
              <div className="px-2 pb-4">
                <StudentsAttendanceTable
                  students={filteredStudents}
                  entries={entries}
                  onStatusChange={onStatusChange}
                  onCommentChange={onCommentChange}
                  locked={locked}
                />
                <div className="px-2 mt-4">
                  <Button onClick={save} disabled={!selectedClassId || !selectedBlockId || locked}>Enregistrer</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
