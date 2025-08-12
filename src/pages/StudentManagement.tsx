import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Search, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditStudentModal from "@/components/students/EditStudentModal";
import StudentProfileDrawer from "@/components/students/StudentProfileDrawer";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { getActiveYearId } from "@/lib/years";
import { getEnrollments } from "@/lib/students";
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  studentNumber?: string;
  birthPlace?: string;
  parentPhone: string;
  gender: "homme" | "femme";
  classId: string;
}

interface Class {
  id: string;
  name: string;
}

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [activeYear, setActiveYear] = useState<string>(() => getActiveYearId());
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);

  useEffect(() => {
    document.title = "Gestion des Élèves — École Manager";
    const savedStudents = JSON.parse(localStorage.getItem("students") || "[]");
    const savedClasses = JSON.parse(localStorage.getItem("classes") || "[]");
    setStudents(savedStudents);
    setClasses(savedClasses);
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "activeYearId") setTimeout(() => setActiveYear(getActiveYearId()), 0);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
const enrollments = useMemo(() => getEnrollments(activeYear), [activeYear]);
const classMap = useMemo(() => new Map<string, string>(enrollments.map((e: any) => [String(e.studentId), String(e.classId)])), [enrollments]);
const filteredStudents = useMemo(() => {
    const inYear = students.filter((s) => classMap.has(s.id));
    const byClass = selectedClassId
      ? inYear.filter((s) => classMap.get(s.id) === selectedClassId)
      : inYear;
    if (!search.trim()) return byClass;
    const q = search.toLowerCase();
    return byClass.filter((s) =>
      [s.firstName, s.lastName, s.studentNumber ?? "", s.parentPhone].some((v) =>
        (v as string)?.toLowerCase?.().includes(q)
      )
    );
  }, [students, selectedClassId, search, classMap]);

  const getClassName = (classId: string) => {
    const cls = classes.find((c) => c.id === classId);
    return cls ? cls.name : "Classe inconnue";
  };

  const handleSaveEdit = (updatedStudent: Student) => {
    const updatedStudents = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
    setStudents(updatedStudents);
    localStorage.setItem("students", JSON.stringify(updatedStudents));
    setEditingStudent(null);
    setMessage("Élève modifié avec succès!");
    setTimeout(() => setMessage(""), 3000);
  };

const requestDelete = (id: string) => {
    const st = students.find((s) => s.id === id) || null;
    setStudentToDelete(st);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!studentToDelete) return;
    const updatedStudents = students.filter((s) => s.id !== studentToDelete.id);
    setStudents(updatedStudents);
    localStorage.setItem("students", JSON.stringify(updatedStudents));
    setMessage("Élève supprimé avec succès!");
    setTimeout(() => setMessage(""), 3000);
    setConfirmOpen(false);
    setStudentToDelete(null);
  };

  return (
    <div className="min-h-[60vh] p-2 md:p-4 animate-fade-in">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Gestion des Élèves</h1>
      </header>

      {message && (
        <div
          className={`mb-4 p-4 rounded-md border ${
            message.includes("succès")
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-destructive/10 text-destructive border-destructive/30"
          }`}
        >
          {message}
        </div>
      )}

      <section className="bg-card rounded-lg shadow-sm border border-border">
        <div className="p-4 border-b border-border">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="w-full md:max-w-sm">
              <label className="block text-sm font-medium text-muted-foreground mb-2 whitespace-nowrap">Filtrer par classe</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
              >
                <option value="">Toutes les classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:flex-1">
              <label className="block text-sm font-medium text-muted-foreground mb-2 whitespace-nowrap">Recherche</label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un prénom, nom, N° élève ou téléphone…"
                  className="w-full pl-9 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                />
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          {filteredStudents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucun élève trouvé {selectedClassId ? "dans cette classe" : ""}.
            </p>
          ) : (
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full text-sm whitespace-nowrap min-w-max">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-3 px-4 font-medium whitespace-nowrap">ID</th>
                    <th className="text-left py-3 px-4 font-medium whitespace-nowrap">Prénom</th>
                    <th className="text-left py-3 px-4 font-medium whitespace-nowrap">Nom</th>
                    <th className="text-left py-3 px-4 font-medium whitespace-nowrap">Date de Naissance</th>
                    <th className="text-left py-3 px-4 font-medium whitespace-nowrap">Genre</th>
                    {!selectedClassId && (
                      <th className="text-left py-3 px-4 font-medium whitespace-nowrap">Classe</th>
                    )}
                    <th className="text-left py-3 px-4 font-medium whitespace-nowrap">Téléphone Parent</th>
                    <th className="text-left py-3 px-4 font-medium whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b border-border hover:bg-muted/40">
                      <td className="py-3 px-4">{student.id}</td>
                      <td className="py-3 px-4 font-medium text-foreground">{student.firstName}</td>
                      <td className="py-3 px-4 font-medium text-foreground">{student.lastName}</td>
                      <td className="py-3 px-4">{new Date(student.birthDate).toLocaleDateString("fr-FR")}</td>
                      <td className="py-3 px-4 capitalize">{student.gender}</td>
                      {!selectedClassId && (
                        <td className="py-3 px-4">{getClassName(classMap.get(student.id) || "")}</td>
                      )}
                      <td className="py-3 px-4">{student.parentPhone}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Profil"
                            onClick={() => { setProfileStudent(student); setProfileOpen(true); }}
                            className="hover-scale"
                          >
                            <UserRound className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Modifier"
                            onClick={() => setEditingStudent(student)}
                            className="hover-scale"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Supprimer"
                            onClick={() => requestDelete(student.id)}
                            className="hover-scale"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          classes={classes}
          onSave={handleSaveEdit}
          onCancel={() => setEditingStudent(null)}
        />
      )}
      <StudentProfileDrawer
        open={profileOpen}
        onOpenChange={(v) => { setProfileOpen(v); if (!v) setProfileStudent(null); }}
        student={profileStudent}
        classes={classes}
      />
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'élève ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'élève sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// EditStudentModal moved to a separate component file for maintainability.
