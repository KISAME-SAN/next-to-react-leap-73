import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GraduationCap, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
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

interface Class {
  id: string;
  name: string;
}

export default function GradesManagement() {
  const [activeTab, setActiveTab] = useState<"setup" | "grades">("setup");
  const [selectedSemester, setSelectedSemester] = useState<"premier" | "deuxieme">("premier");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubjects[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [avgModalOpen, setAvgModalOpen] = useState(false);
  const [calcClassId, setCalcClassId] = useState<string>("ALL");

  const availableSubjects = [
    "Anglais",
    "Mathématiques",
    "Physique-Chimie",
    "SVT",
    "Français",
    "Histoire-Géographie",
    "Philosophie",
    "EPS",
    "Économie",
    "Espagnol",
    "Musique",
    "Art",
    "Grec",
    "Portugais",
    "Arabe",
    "Allemand",
    "Italien",
    "Chinois",
  ];

  useEffect(() => {
    document.title = "Gestion des Notes — École Manager";
    const y = getActiveYearId();
    const savedClasses = JSON.parse(localStorage.getItem("classes") || "[]");
    const savedStudents = JSON.parse(localStorage.getItem("students") || "[]");
    const savedClassSubjects = JSON.parse(localStorage.getItem(keyForYear("classSubjects", y)) || "[]");
    const savedGrades = JSON.parse(localStorage.getItem(keyForYear("grades", y)) || "[]");

    setClasses(savedClasses);
    setStudents(savedStudents);
    setClassSubjects(savedClassSubjects);
    setGrades(savedGrades);
  }, []);

  const getCurrentClassSubjects = () => {
    return classSubjects.find((cs) => cs.classId === selectedClassId && cs.semester === selectedSemester);
  };

  const getClassStudents = () => {
    const y = getActiveYearId();
    const ens = getEnrollments(y);
    const ids = new Set(ens.filter((e) => e.classId === selectedClassId).map((e) => e.studentId));
    return students.filter((s) => ids.has(s.id));
  };

  const handleCreateClassSubjects = () => {
    if (!selectedClassId) return;

    const newClassSubjects: ClassSubjects = {
      id: Date.now().toString(),
      classId: selectedClassId,
      semester: selectedSemester,
      subjects: [],
      createdAt: new Date().toISOString(),
    };

    const updatedClassSubjects = [...classSubjects, newClassSubjects];
    setClassSubjects(updatedClassSubjects);
    localStorage.setItem(keyForYear("classSubjects"), JSON.stringify(updatedClassSubjects));
    setMessage("Configuration créée avec succès!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleAddSubject = (subjectData: Omit<Subject, "id">) => {
    if (!selectedClassId) return;

    const currentConfig = getCurrentClassSubjects();
    if (!currentConfig) return;

    const newSubject: Subject = { id: Date.now().toString(), ...subjectData };

    const updatedConfig = { ...currentConfig, subjects: [...currentConfig.subjects, newSubject] };

    const updatedClassSubjects = classSubjects.map((cs) => (cs.id === currentConfig.id ? updatedConfig : cs));

    setClassSubjects(updatedClassSubjects);
    localStorage.setItem(keyForYear("classSubjects"), JSON.stringify(updatedClassSubjects));
    setShowSubjectForm(false);
    setMessage("Matière ajoutée avec succès!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleEditSubject = (updatedSubject: Subject) => {
    const currentConfig = getCurrentClassSubjects();
    if (!currentConfig) return;

    const updatedConfig = {
      ...currentConfig,
      subjects: currentConfig.subjects.map((s) => (s.id === updatedSubject.id ? updatedSubject : s)),
    };

    const updatedClassSubjects = classSubjects.map((cs) => (cs.id === currentConfig.id ? updatedConfig : cs));

    setClassSubjects(updatedClassSubjects);
    localStorage.setItem(keyForYear("classSubjects"), JSON.stringify(updatedClassSubjects));
    setEditingSubject(null);
    setMessage("Matière modifiée avec succès!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleDeleteSubject = (subjectId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette matière?")) return;

    const currentConfig = getCurrentClassSubjects();
    if (!currentConfig) return;

    const updatedConfig = {
      ...currentConfig,
      subjects: currentConfig.subjects.filter((s) => s.id !== subjectId),
    };

    const updatedClassSubjects = classSubjects.map((cs) => (cs.id === currentConfig.id ? updatedConfig : cs));

    setClassSubjects(updatedClassSubjects);
    localStorage.setItem(keyForYear("classSubjects"), JSON.stringify(updatedClassSubjects));
    setMessage("Matière supprimée avec succès!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleSaveGrade = (
    studentId: string,
    subjectId: string,
    gradeType: string,
    value: number
  ) => {
    const existingGrade = grades.find(
      (g) => g.studentId === studentId && g.subjectId === subjectId && g.classId === selectedClassId && g.semester === selectedSemester
    );

    if (existingGrade) {
      const updatedGrade = { ...existingGrade, [gradeType]: value } as Grade;
      const updatedGrades = grades.map((g) => (g.id === existingGrade.id ? updatedGrade : g));
      setGrades(updatedGrades);
      localStorage.setItem(keyForYear("grades"), JSON.stringify(updatedGrades));
    } else {
      const newGrade: Grade = {
        id: Date.now().toString(),
        studentId,
        subjectId,
        classId: selectedClassId,
        semester: selectedSemester,
        [gradeType]: value,
        createdAt: new Date().toISOString(),
      } as Grade;

      const updatedGrades = [...grades, newGrade];
      setGrades(updatedGrades);
      localStorage.setItem(keyForYear("grades"), JSON.stringify(updatedGrades));
    }
  };

  const getStudentGrade = (studentId: string, subjectId: string) => {
    return grades.find(
      (g) => g.studentId === studentId && g.subjectId === subjectId && g.classId === selectedClassId && g.semester === selectedSemester
    );
  };

  const calculateAverage = (grade: Grade, subject: Subject) => {
    const scores: number[] = [];
    if (grade.devoir1 !== undefined) scores.push(grade.devoir1);
    if (grade.devoir2 !== undefined) scores.push(grade.devoir2);
    if (grade.composition !== undefined) scores.push(grade.composition * 2);

    if (scores.length === 0) return null;

    const total = scores.reduce((sum, score) => sum + score, 0);
    const weight = scores.length === 3 ? 4 : scores.length;

    return (total / weight) * subject.coefficient;
  };

  return (
    <div className="min-h-[60vh] p-2 md:p-4 animate-fade-in">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground animate-slide-up">Gestion des Notes</h1>
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

      <section className="bg-card rounded-lg shadow-sm p-4 border border-border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Semestre</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value as "premier" | "deuxieme")}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
            >
              <option value="premier">Premier Semestre</option>
              <option value="deuxieme">Deuxième Semestre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Classe</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
            >
              <option value="">Sélectionner une classe</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end justify-between md:justify-end">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={activeTab === "setup" ? "default" : "outline"}
                onClick={() => setActiveTab("setup")}
              >
                Configuration
              </Button>
              <Button
                type="button"
                variant={activeTab === "grades" ? "default" : "outline"}
                onClick={() => setActiveTab("grades")}
                disabled={!getCurrentClassSubjects()}
              >
                Saisie Notes
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setAvgModalOpen(true)}
              >
                Calculer les moyennes
              </Button>
            </div>
          </div>
        </div>
      </section>

      {selectedClassId && (
        <>
          {activeTab === "setup" && (
            <SetupTab
              currentConfig={getCurrentClassSubjects()}
              onCreateConfig={handleCreateClassSubjects}
              onAddSubject={() => setShowSubjectForm(true)}
              onEditSubject={setEditingSubject}
              onDeleteSubject={handleDeleteSubject}
              students={getClassStudents()}
            />
          )}

          {activeTab === "grades" && getCurrentClassSubjects() && (
            <GradesTab
              config={getCurrentClassSubjects()!}
              students={getClassStudents()}
              grades={grades}
              onSaveGrade={handleSaveGrade}
              getStudentGrade={getStudentGrade}
              calculateAverage={calculateAverage}
            />
          )}
        </>
      )}

      {showSubjectForm && (
        <SubjectForm
          students={getClassStudents()}
          availableSubjects={availableSubjects}
          onSave={handleAddSubject}
          onCancel={() => setShowSubjectForm(false)}
        />
      )}

      {editingSubject && (
        <SubjectForm
          students={getClassStudents()}
          availableSubjects={availableSubjects}
          initialData={editingSubject}
          onSave={handleEditSubject}
          onCancel={() => setEditingSubject(null)}
          isEditing
        />
      )}

      <Dialog open={avgModalOpen} onOpenChange={setAvgModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calculer les moyennes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Classe</label>
              <select
                value={calcClassId}
                onChange={(e) => setCalcClassId(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
              >
                <option value="ALL">Toutes les classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                Semestre: {selectedSemester === "premier" ? "Premier" : "Deuxième"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAvgModalOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                setAvgModalOpen(false);
                const target = calcClassId.toLowerCase() === "all" ? "all" : calcClassId;
                navigate(`/grades/averages?classId=${target}&semester=${selectedSemester}`);
              }}
            >
              Calculer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SetupTabProps {
  currentConfig: ClassSubjects | undefined;
  onCreateConfig: () => void;
  onAddSubject: () => void;
  onEditSubject: (subject: Subject) => void;
  onDeleteSubject: (subjectId: string) => void;
  students: Student[];
}

function SetupTab({ currentConfig, onCreateConfig, onAddSubject, onEditSubject, onDeleteSubject, students }: SetupTabProps) {
  if (!currentConfig) {
    return (
      <div className="bg-card rounded-lg shadow-sm p-8 text-center border border-border">
        <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">Aucune configuration trouvée</h3>
        <p className="text-muted-foreground mb-6">Créez une configuration pour cette classe et ce semestre</p>
        <Button onClick={onCreateConfig}>Créer la configuration</Button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Configuration des Matières</h2>
        <Button onClick={onAddSubject} variant="secondary" className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Ajouter une Matière</span>
        </Button>
      </div>

      <div className="p-4">
        {currentConfig.subjects.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Aucune matière configurée. Ajoutez votre première matière.</p>
        ) : (
          <div className="space-y-4">
            {currentConfig.subjects.map((subject) => (
              <div key={subject.id} className="border border-border rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-medium text-foreground">{subject.name}</h3>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">Coef. {subject.coefficient}</span>
                      {subject.languageType && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">{subject.languageType}</span>
                      )}
                      {subject.isOptional && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded">Optionnelle</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{subject.studentIds.length} élève(s) inscrit(s)</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {subject.studentIds.map((studentId) => {
                        const student = students.find((s) => s.id === studentId);
                        return student ? (
                          <span key={studentId} className="px-2 py-0.5 bg-muted/40 text-foreground text-xs rounded">
                            {student.firstName} {student.lastName}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm" onClick={() => onEditSubject(subject)}>
                      Modifier
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => onDeleteSubject(subject.id)}>
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface GradesTabProps {
  config: ClassSubjects;
  students: Student[];
  grades: Grade[];
  onSaveGrade: (studentId: string, subjectId: string, gradeType: string, value: number) => void;
  getStudentGrade: (studentId: string, subjectId: string) => Grade | undefined;
  calculateAverage: (grade: Grade, subject: Subject) => number | null;
}

function GradesTab({ config, students, onSaveGrade, getStudentGrade, calculateAverage }: GradesTabProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const selectedSubject = config.subjects.find((s) => s.id === selectedSubjectId);
  const eligibleStudents = selectedSubject ? students.filter((s) => selectedSubject.studentIds.includes(s.id)) : [];

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground">Matière</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
          >
            <option value="">Sélectionner une matière</option>
            {config.subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name} ({subject.studentIds.length} élèves)
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-4">
        {!selectedSubject ? (
          <p className="text-muted-foreground text-center py-8">Sélectionnez une matière pour saisir les notes</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-3 px-4 font-medium">ID</th>
                  <th className="text-left py-3 px-4 font-medium">Élève</th>
                  <th className="text-center py-3 px-4 font-medium">Devoir 1</th>
                  <th className="text-center py-3 px-4 font-medium">Devoir 2</th>
                  <th className="text-center py-3 px-4 font-medium">Composition</th>
                  <th className="text-center py-3 px-4 font-medium">Moyenne</th>
                </tr>
              </thead>
              <tbody>
                {eligibleStudents.map((student) => {
                  const grade = getStudentGrade(student.id, selectedSubject.id);
                  const average = grade ? calculateAverage(grade, selectedSubject) : null;

                  return (
                    <tr key={student.id} className="border-b border-border hover:bg-muted/40">
                      <td className="py-3 px-4 text-foreground">{student.id}</td>
                      <td className="py-3 px-4 font-medium text-foreground">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min={0}
                          max={20}
                          step={0.25}
                          value={grade?.devoir1 ?? ""}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value)) onSaveGrade(student.id, selectedSubject.id, "devoir1", value);
                          }}
                          className="w-20 px-2 py-1 border border-input rounded text-center focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                          placeholder="--"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min={0}
                          max={20}
                          step={0.25}
                          value={grade?.devoir2 ?? ""}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value)) onSaveGrade(student.id, selectedSubject.id, "devoir2", value);
                          }}
                          className="w-20 px-2 py-1 border border-input rounded text-center focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                          placeholder="--"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min={0}
                          max={20}
                          step={0.25}
                          value={grade?.composition ?? ""}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value)) onSaveGrade(student.id, selectedSubject.id, "composition", value);
                          }}
                          className="w-20 px-2 py-1 border border-input rounded text-center focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                          placeholder="--"
                        />
                      </td>
                      <td className="py-3 px-4 text-center font-medium">
                        {average !== null ? (
                          <span className={`px-2 py-1 rounded ${average >= 10 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {average.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

interface SubjectFormProps {
  students: Student[];
  availableSubjects: string[];
  initialData?: Subject;
  onSave: (subject: any) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

function SubjectForm({ students, availableSubjects, initialData, onSave, onCancel, isEditing = false }: SubjectFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    coefficient: initialData?.coefficient || 1,
    isOptional: initialData?.isOptional || false,
    languageType: initialData?.languageType || null as "LV1" | "LV2" | null,
    studentIds: initialData?.studentIds || ([] as string[]),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && initialData) {
      onSave({ ...initialData, ...formData });
    } else {
      onSave(formData);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    const updatedStudentIds = formData.studentIds.includes(studentId)
      ? formData.studentIds.filter((id) => id !== studentId)
      : [...formData.studentIds, studentId];

    setFormData({ ...formData, studentIds: updatedStudentIds });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-border shadow-sm">
        <h2 className="text-2xl font-bold mb-4 text-foreground text-center">
          {isEditing ? "Modifier la Matière" : "Ajouter une Matière"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Matière *</label>
              <select
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                required
              >
                <option value="">Sélectionner une matière</option>
                {availableSubjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Coefficient *</label>
              <input
                type="number"
                min={0.5}
                max={10}
                step={0.5}
                value={formData.coefficient}
                onChange={(e) => setFormData({ ...formData, coefficient: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Type de Langue (optionnel)</label>
              <select
                value={formData.languageType || ""}
                onChange={(e) =>
                  setFormData({ ...formData, languageType: (e.target.value || null) as "LV1" | "LV2" | null })
                }
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
              >
                <option value="">Aucun</option>
                <option value="LV1">LV1</option>
                <option value="LV2">LV2</option>
              </select>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isOptional}
                onChange={(e) => setFormData({ ...formData, isOptional: e.target.checked })}
              />
              <span className="text-sm font-medium text-foreground">Matière optionnelle</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Élèves concernés * (au moins un élève requis)
            </label>
            <div className="border border-border rounded-md p-4 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {students.map((student) => (
                  <label key={student.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={formData.studentIds.includes(student.id)}
                      onChange={() => handleStudentToggle(student.id)}
                    />
                    <span className="text-sm text-foreground">
                      {student.firstName} {student.lastName}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {formData.studentIds.length === 0 && (
              <p className="text-destructive text-sm mt-1">Veuillez sélectionner au moins un élève</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" disabled={formData.studentIds.length === 0}>
              {isEditing ? "Modifier" : "Ajouter"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
