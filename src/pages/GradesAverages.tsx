import { useEffect, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getActiveYearId, keyForYear } from "@/lib/years";
import { getEnrollments } from "@/lib/students";

interface Subject {
  id: string;
  name: string;
  coefficient: number;
  isOptional: boolean;
  languageType?: "LV1" | "LV2" | null;
  studentIds: string[];
}

interface ClassSubjects {
  id: string;
  classId: string;
  semester: "premier" | "deuxieme";
  subjects: Subject[];
  createdAt: string;
}

interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  classId: string;
  semester: "premier" | "deuxieme";
  devoir1?: number;
  devoir2?: number;
  composition?: number;
  createdAt: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  classId: string;
}

interface ClassItem {
  id: string;
  name: string;
}

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function GradesAverages() {
  const query = useQuery();
  const classId = (query.get("classId") || "all").toLowerCase();
  const semester = (query.get("semester") as "premier" | "deuxieme") || "premier";

  useEffect(() => {
    // basic SEO handled by SEO component below
  }, [classId, semester]);

  const classes: ClassItem[] = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("classes") || "[]");
    } catch {
      return [];
    }
  }, []);

  const students: Student[] = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("students") || "[]");
    } catch {
      return [];
    }
  }, []);

  const classSubjects: ClassSubjects[] = useMemo(() => {
    try {
      const y = getActiveYearId();
      return JSON.parse(localStorage.getItem(keyForYear("classSubjects", y)) || "[]");
    } catch {
      return [];
    }
  }, []);

  const grades: Grade[] = useMemo(() => {
    try {
      const y = getActiveYearId();
      return JSON.parse(localStorage.getItem(keyForYear("grades", y)) || "[]");
    } catch {
      return [];
    }
  }, []);

  const computeClassRanking = (clsId: string) => {
    const cfg = classSubjects.find((cs) => cs.classId === clsId && cs.semester === semester);
    if (!cfg) return [] as { id: string; name: string; average: number }[];

    const y = getActiveYearId();
    const ens = getEnrollments(y);
    const ids = new Set(ens.filter((e) => e.classId === clsId).map((e) => e.studentId));
    const classStudents = students.filter((s) => ids.has(s.id));
    const results = classStudents.map((st) => {
      const subjects = cfg.subjects.filter((subj) => subj.studentIds.includes(st.id));
      const sumCoef = subjects.reduce((acc, s) => acc + (Number(s.coefficient) || 0), 0);

      let weightedSum = 0;
      subjects.forEach((subj) => {
        const g = grades.find(
          (gr) =>
            gr.studentId === st.id &&
            gr.subjectId === subj.id &&
            gr.classId === clsId &&
            gr.semester === semester
        );
        const d1 = g?.devoir1 ?? 0;
        const d2 = g?.devoir2 ?? 0;
        const comp = g?.composition ?? 0;
        const subjectMean = (d1 + d2 + comp) / 3; // user requested formula
        weightedSum += subjectMean * (Number(subj.coefficient) || 0);
      });

      const average = sumCoef > 0 ? weightedSum / sumCoef : 0;
      return { id: st.id, name: `${st.firstName} ${st.lastName}`.trim(), average };
    });

    return results
      .sort((a, b) => b.average - a.average)
      .map((r) => ({ ...r, average: Math.round(r.average * 100) / 100 }));
  };

  const pageTitle = classId === "all" ? "Moyennes — Toutes les classes" : `Moyennes — ${classes.find((c) => c.id === classId)?.name || "Classe"}`;
  const pageDesc = `Classement par mérite des moyennes (${semester === "premier" ? "Semestre 1" : "Semestre 2"}).`;

  return (
    <>
      <SEO title={pageTitle} description={pageDesc} canonical={window.location.href} jsonLd={null} />
      <main className="min-h-[60vh] p-2 md:p-4 animate-fade-in">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">
            {classId === "all" ? "Moyennes des élèves — Toutes les classes" : `Moyennes des élèves — ${classes.find((c) => c.id === classId)?.name || "Classe"}`}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Semestre: {semester === "premier" ? "Premier" : "Deuxième"}</p>
          <div className="mt-4">
            <Button asChild variant="secondary">
              <Link to="/grades">⟵ Retour à la gestion des notes</Link>
            </Button>
          </div>
        </header>

        {classId === "all" ? (
          <section className="space-y-8">
            {classes.map((c) => {
              const ranking = computeClassRanking(c.id);
              if (ranking.length === 0) return null;
              return (
                <article key={c.id} className="bg-card rounded-lg shadow-sm border border-border p-4">
                  <h2 className="text-xl font-semibold mb-4">{c.name}</h2>
                  <RankingTable data={ranking} includeClass={false} />
                </article>
              );
            })}
          </section>
        ) : (
          <section>
            {(() => {
              const ranking = computeClassRanking(classId);
              return ranking.length === 0 ? (
                <p className="text-muted-foreground">Aucune donnée disponible pour cette classe et ce semestre.</p>
              ) : (
                <article className="bg-card rounded-lg shadow-sm border border-border p-4">
                  <RankingTable data={ranking} includeClass={false} />
                </article>
              );
            })()}
          </section>
        )}
      </main>
    </>
  );
}

function RankingTable({ data, includeClass }: { data: { id: string; name: string; average: number }[]; includeClass: boolean }) {
  return (
    <Table className="min-w-[480px]">
      <TableCaption>Classement des élèves par ordre de mérite</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Rang</TableHead>
          <TableHead>Élève</TableHead>
          {includeClass && <TableHead>Classe</TableHead>}
          <TableHead>Moyenne Générale</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, idx) => (
          <TableRow key={row.id}>
            <TableCell>{idx + 1}</TableCell>
            <TableCell className="font-medium">{row.name}</TableCell>
            {includeClass && <TableCell></TableCell>}
            <TableCell>{row.average.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
