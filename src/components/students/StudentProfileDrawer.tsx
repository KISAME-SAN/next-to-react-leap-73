import { useMemo } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { getStudentHistory } from "@/lib/students";
import { keyForYear, listYears } from "@/lib/years";

// Local types aligned with current pages
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  studentNumber?: string;
  birthPlace?: string;
  parentPhone?: string;
  contact?: string;
  gender?: string;
}
interface ClassItem { id: string; name: string }

// Grades-related types (as used in GradesAverages)
interface Subject {
  id: string;
  name: string;
  coefficient: number;
  isOptional: boolean;
  languageType?: "LV1" | "LV2" | null;
  studentIds: string[];
}
interface ClassSubjects { id: string; classId: string; semester: "premier" | "deuxieme"; subjects: Subject[]; createdAt: string }
interface Grade { id: string; studentId: string; subjectId: string; classId: string; semester: "premier" | "deuxieme"; devoir1?: number; devoir2?: number; composition?: number; createdAt: string }

// Payments
type PaymentType = "inscription" | "mensualite" | "frais" | "service";
interface StudentPayment { id: string; studentId: string; type: PaymentType; classeId?: string; mois?: string; itemId?: string; method?: string; amount: number; date: string }

// Attendance
type AttendanceStatus = "present" | "absent" | "retard" | "renvoi";
interface AttendanceEntry { studentId: string; status: AttendanceStatus; comment?: string }
interface AttendanceRecord { id: string; date: string; classId: string; scheduleBlockId: string; entries: AttendanceEntry[]; createdAt: string; locked?: boolean }

export default function StudentProfileDrawer({ open, onOpenChange, student, classes }: { open: boolean; onOpenChange: (v: boolean) => void; student: Student | null; classes: ClassItem[]; }) {
  const classNameOf = (id?: string) => classes.find(c => c.id === id)?.name || "";

  const history = useMemo(() => student ? getStudentHistory(student.id) : [], [student]);
  const years = useMemo(() => listYears(), []);

  const classSubjects = useMemo<ClassSubjects[]>(() => {
    try { return JSON.parse(localStorage.getItem("classSubjects") || "[]"); } catch { return []; }
  }, []);
  const grades = useMemo<Grade[]>(() => {
    try { return JSON.parse(localStorage.getItem("grades") || "[]"); } catch { return []; }
  }, []);
  const attendance = useMemo<AttendanceRecord[]>(() => {
    try { return JSON.parse(localStorage.getItem("attendanceRecords") || "[]"); } catch { return []; }
  }, []);

  function computeYearAverages(yearId: string, classId: string) {
    const semesters: ("premier" | "deuxieme")[] = ["premier", "deuxieme"];
    const out: Record<string, number | null> = { premier: null, deuxieme: null, overall: null };

    let cs: ClassSubjects[] = [];
    let gr: Grade[] = [];
    try { cs = JSON.parse(localStorage.getItem(keyForYear("classSubjects", yearId)) || "[]"); } catch { cs = []; }
    try { gr = JSON.parse(localStorage.getItem(keyForYear("grades", yearId)) || "[]"); } catch { gr = []; }

    semesters.forEach((sem) => {
      if (!student) { out[sem] = null; return; }
      const cfg = cs.find((c) => c.classId === classId && c.semester === sem);
      if (!cfg) { out[sem] = null; return; }
      const subjects = cfg.subjects.filter((s) => s.studentIds.includes(student.id));
      const sumCoef = subjects.reduce((acc, s) => acc + (Number(s.coefficient) || 0), 0);
      if (sumCoef === 0) { out[sem] = null; return; }
      let weighted = 0;
      subjects.forEach((subj) => {
        const g = gr.find((r) => r.studentId === student.id && r.subjectId === subj.id && r.classId === classId && r.semester === sem);
        const d1 = g?.devoir1 ?? 0; const d2 = g?.devoir2 ?? 0; const comp = g?.composition ?? 0;
        const mean = (d1 + d2 + comp) / 3;
        weighted += mean * (Number(subj.coefficient) || 0);
      });
      out[sem] = Math.round((weighted / sumCoef) * 100) / 100;
    });
    const vals = [out.premier, out.deuxieme].filter((v) => typeof v === "number") as number[];
    out.overall = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : null;
    return out as { premier: number | null; deuxieme: number | null; overall: number | null };
  }

  function computeYearPayments(yearId: string) {
    if (!student) return { total: 0, byType: {} as Record<PaymentType, number>, months: 0 };
    const key = keyForYear("studentPayments", yearId);
    let list: StudentPayment[] = [];
    try { list = JSON.parse(localStorage.getItem(key) || "[]"); } catch { list = []; }
    const mine = list.filter((p) => p.studentId === student.id);
    const byType: Record<PaymentType, number> = { inscription: 0, mensualite: 0, frais: 0, service: 0 } as any;
    const months = new Set<string>();
    let total = 0;
    mine.forEach((p) => {
      total += Number(p.amount) || 0;
      byType[p.type] = (byType[p.type] || 0) + (Number(p.amount) || 0);
      if (p.type === "mensualite" && p.mois) months.add(p.mois);
    });
    return { total, byType, months: months.size };
  }

  function computeYearAttendance(yearId: string) {
    if (!student) return { absent: 0, retard: 0, present: 0, renvoi: 0 };
    const y = years.find((y) => y.id === yearId);
    if (!y) return { absent: 0, retard: 0, present: 0, renvoi: 0 };
    const start = new Date(y.debut);
    const end = new Date(y.fin);
    const counts: Record<AttendanceStatus, number> = { present: 0, absent: 0, retard: 0, renvoi: 0 };
    attendance.forEach((rec) => {
      const d = new Date(rec.date);
      if (d >= start && d <= end) {
        rec.entries.forEach((e) => {
          if (e.studentId === student.id) counts[e.status] += 1;
        });
      }
    });
    return counts;
  }

  const firstEnrollmentDate = useMemo(() => {
    if (!history.length) return null;
    const dates = history.map((h) => h.date).filter(Boolean) as string[];
    if (!dates.length) return null;
    return dates.sort()[0]!;
  }, [history]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] overflow-y-auto">
        <DrawerHeader>
          <DrawerTitle className="text-2xl">
            Profil élève {student ? `— ${student.firstName} ${student.lastName}` : ""}
          </DrawerTitle>
          <DrawerDescription>
            Vue consolidée: informations, parcours, notes, paiements et présences par année.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6">
          {student && (
            <section className="rounded-lg border border-border bg-card p-4 mb-4">
              <h2 className="text-lg font-semibold mb-3">Informations</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">ID:</span> <span className="font-medium">{student.id}</span></div>
                <div><span className="text-muted-foreground">Prénom:</span> <span className="font-medium">{student.firstName}</span></div>
                <div><span className="text-muted-foreground">Nom:</span> <span className="font-medium">{student.lastName}</span></div>
                {student.birthDate && (
                  <div><span className="text-muted-foreground">Naissance:</span> <span className="font-medium">{new Date(student.birthDate).toLocaleDateString("fr-FR")}</span></div>
                )}
                {(student.parentPhone || student.contact) && (
                  <div><span className="text-muted-foreground">Téléphone parent:</span> <span className="font-medium">{student.parentPhone || student.contact}</span></div>
                )}
                {student.studentNumber && (
                  <div><span className="text-muted-foreground">N° élève:</span> <span className="font-medium">{student.studentNumber}</span></div>
                )}
                {student.gender && (
                  <div><span className="text-muted-foreground">Genre:</span> <span className="font-medium capitalize">{student.gender}</span></div>
                )}
                {firstEnrollmentDate && (
                  <div><span className="text-muted-foreground">Dans l'école depuis:</span> <span className="font-medium">{new Date(firstEnrollmentDate).toLocaleDateString("fr-FR")}</span></div>
                )}
              </div>
            </section>
          )}

          <Tabs defaultValue="parcours" className="w-full">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="parcours">Parcours</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="paiements">Paiements</TabsTrigger>
              <TabsTrigger value="presences">Présences</TabsTrigger>
              <TabsTrigger value="resume">Résumé</TabsTrigger>
            </TabsList>

            <TabsContent value="parcours" className="mt-4">
              <article className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-base font-semibold mb-3">Historique des inscriptions</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Année</TableHead>
                      <TableHead>Classe</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((h) => (
                      <TableRow key={`${h.yearId}-${h.classId}`}>
                        <TableCell>{h.yearId}</TableCell>
                        <TableCell>{classNameOf(h.classId)}</TableCell>
                        <TableCell className="capitalize">{h.status || "active"}</TableCell>
                        <TableCell>{h.date ? new Date(h.date).toLocaleDateString("fr-FR") : "—"}</TableCell>
                      </TableRow>
                    ))}
                    {history.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Aucun historique trouvé.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </article>
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <article className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-base font-semibold mb-3">Moyennes par année</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Année</TableHead>
                      <TableHead>Classe</TableHead>
                      <TableHead>Sem. 1</TableHead>
                      <TableHead>Sem. 2</TableHead>
                      <TableHead>Générale</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((h) => {
                      const avg = computeYearAverages(h.yearId, h.classId);
                      return (
                        <TableRow key={`g-${h.yearId}`}>
                          <TableCell>{h.yearId}</TableCell>
                          <TableCell>{classNameOf(h.classId)}</TableCell>
                          <TableCell>{avg.premier != null ? avg.premier.toFixed(2) : "—"}</TableCell>
                          <TableCell>{avg.deuxieme != null ? avg.deuxieme.toFixed(2) : "—"}</TableCell>
                          <TableCell>{avg.overall != null ? avg.overall.toFixed(2) : "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                    {history.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Aucune donnée disponible.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </article>
            </TabsContent>

            <TabsContent value="paiements" className="mt-4">
              <article className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-base font-semibold mb-3">Paiements par année</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Année</TableHead>
                      <TableHead>Total payé</TableHead>
                      <TableHead>Inscription</TableHead>
                      <TableHead>Mensualités (mois)</TableHead>
                      <TableHead>Frais</TableHead>
                      <TableHead>Services</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((h) => {
                      const p = computeYearPayments(h.yearId);
                      return (
                        <TableRow key={`p-${h.yearId}`}>
                          <TableCell>{h.yearId}</TableCell>
                          <TableCell className="font-medium">{p.total.toLocaleString("fr-FR", { style: "currency", currency: "XOF" })}</TableCell>
                          <TableCell>{(p.byType.inscription || 0).toLocaleString("fr-FR", { style: "currency", currency: "XOF" })}</TableCell>
                          <TableCell>{(p.byType.mensualite || 0).toLocaleString("fr-FR", { style: "currency", currency: "XOF" })} <span className="text-muted-foreground">({p.months} mois)</span></TableCell>
                          <TableCell>{(p.byType.frais || 0).toLocaleString("fr-FR", { style: "currency", currency: "XOF" })}</TableCell>
                          <TableCell>{(p.byType.service || 0).toLocaleString("fr-FR", { style: "currency", currency: "XOF" })}</TableCell>
                        </TableRow>
                      );
                    })}
                    {history.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Aucun paiement trouvé.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground mt-2">Remarque: le statut "soldé" dépend de la configuration des frais; non calculé ici.</p>
              </article>
            </TabsContent>

            <TabsContent value="presences" className="mt-4">
              <article className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-base font-semibold mb-3">Présences par année</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Année</TableHead>
                      <TableHead>Absences</TableHead>
                      <TableHead>Retards</TableHead>
                      <TableHead>Présences</TableHead>
                      <TableHead>Renvois</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((h) => {
                      const c = computeYearAttendance(h.yearId);
                      return (
                        <TableRow key={`a-${h.yearId}`}>
                          <TableCell>{h.yearId}</TableCell>
                          <TableCell>{c.absent}</TableCell>
                          <TableCell>{c.retard}</TableCell>
                          <TableCell>{c.present}</TableCell>
                          <TableCell>{c.renvoi}</TableCell>
                        </TableRow>
                      );
                    })}
                    {history.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Aucune présence enregistrée.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </article>
            </TabsContent>

            <TabsContent value="resume" className="mt-4">
              <article className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-base font-semibold mb-3">Résumé</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <div className="text-muted-foreground">Années fréquentées</div>
                      <div className="font-medium">{history.length}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Classe la plus récente</div>
                      <div className="font-medium">{history[history.length - 1] ? classNameOf(history[history.length - 1].classId) : "—"}</div>
                    </div>
                    {firstEnrollmentDate && (
                      <div>
                        <div className="text-muted-foreground">Depuis</div>
                        <div className="font-medium">{new Date(firstEnrollmentDate).toLocaleDateString("fr-FR")}</div>
                      </div>
                    )}
                  </div>
                  <Separator className="my-2" />
                  <p className="text-muted-foreground">Consultez les onglets pour plus de détails annuels: moyennes, paiements, présences.</p>
                </div>
              </article>
            </TabsContent>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
