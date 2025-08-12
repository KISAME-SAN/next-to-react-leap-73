import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { getActiveYearId } from "@/lib/years";
import { getAssignedTeacherIds, setTeacherAssigned } from "@/lib/teachers";
interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  hireDate: string;
  paymentType: "fixe" | "horaire";
  salary?: number;
  hourlyRate?: number;
  gender: "homme" | "femme";
  residence: string;
  contactType: "telephone" | "email" | "whatsapp" | "sms";
  yearsExperience: number;
  nationality: string;
  emergencyContact: string;
  emergencyPhone: string;
}

interface Subject {
  id: string;
  name: string;
}

const subjects: Subject[] = [
  { id: "anglais", name: "Anglais" },
  { id: "mathematiques", name: "Mathématiques" },
  { id: "physique-chimie", name: "Physique-Chimie" },
  { id: "svt", name: "SVT" },
  { id: "francais", name: "Français" },
  { id: "histoire-geographie", name: "Histoire-Géographie" },
  { id: "philosophie", name: "Philosophie" },
  { id: "eps", name: "EPS" },
  { id: "economie", name: "Économie" },
  { id: "espagnol", name: "Espagnol" },
  { id: "musique", name: "Musique" },
  { id: "art", name: "Art" },
  { id: "grec", name: "Grec" },
  { id: "portugais", name: "Portugais" },
  { id: "arabe", name: "Arabe" },
];

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredSubject, setFilteredSubject] = useState("");
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    document.title = "Gestion des Professeurs — École Manager";
    const savedTeachers = JSON.parse(localStorage.getItem("teachers") || "[]");
    setTeachers(savedTeachers);
  }, []);
  const yearId = getActiveYearId();
  const [assigned, setAssigned] = useState<string[]>(() => getAssignedTeacherIds(yearId));
  const filteredTeachers = filteredSubject
    ? teachers.filter((teacher) => teacher.subject === filteredSubject)
    : teachers;

  const toggleAssigned = (id: string) => {
    const isOn = assigned.includes(id);
    setTeacherAssigned(id, !isOn, yearId);
    setAssigned((prev) => {
      const set = new Set(prev);
      if (isOn) set.delete(id); else set.add(id);
      return Array.from(set);
    });
  };
  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject ? subject.name : subjectId;
  };

  const getContactTypeName = (contactType: string) => {
    const types = {
      telephone: "Téléphone",
      email: "Email",
      whatsapp: "WhatsApp",
      sms: "SMS",
    } as const;
    return (types as any)[contactType] || contactType;
  };

  const handleSaveEdit = (updatedTeacher: Teacher) => {
    const updatedTeachers = teachers.map((t) => (t.id === updatedTeacher.id ? updatedTeacher : t));
    setTeachers(updatedTeachers);
    localStorage.setItem("teachers", JSON.stringify(updatedTeachers));
    setEditingTeacher(null);
    setMessage("Professeur modifié avec succès!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleDelete = (teacherId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce professeur?")) {
      const updatedTeachers = teachers.filter((t) => t.id !== teacherId);
      setTeachers(updatedTeachers);
      localStorage.setItem("teachers", JSON.stringify(updatedTeachers));
      setMessage("Professeur supprimé avec succès!");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="min-h-[60vh] p-2 md:p-4 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground text-center animate-slide-up">Gestion des Professeurs</h1>
      </header>

      {message && (
        <div className="mb-6 p-4 rounded-md border bg-green-50 text-green-700 border-green-200">{message}</div>
      )}

      <section className="bg-card rounded-lg shadow-sm border border-border mb-6">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground">Filtrer par matière</label>
            <select
              value={filteredSubject}
              onChange={(e) => setFilteredSubject(e.target.value)}
              className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
            >
              <option value="">Toutes les matières</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-4">
          {filteredTeachers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucun professeur trouvé {filteredSubject ? "pour cette matière" : ""}.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-3 px-4 font-medium">ID</th>
                    <th className="text-left py-3 px-4 font-medium">Nom Complet</th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Matière</th>
                    <th className="text-left py-3 px-4 font-medium">Téléphone</th>
                    <th className="text-left py-3 px-4 font-medium">Résidence</th>
                    <th className="text-left py-3 px-4 font-medium">Rémunération</th>
                    <th className="text-left py-3 px-4 font-medium">Expérience</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="border-b border-border hover:bg-muted/40">
                      <td className="py-3 px-4">{teacher.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground">
                          {teacher.firstName} {teacher.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">{teacher.nationality}</div>
                      </td>
                      <td className="py-3 px-4 text-primary">{teacher.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          {getSubjectName(teacher.subject)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>{teacher.phone}</div>
                        <div className="text-xs text-muted-foreground">
                          {getContactTypeName(teacher.contactType || "telephone")}
                        </div>
                      </td>
                      <td className="py-3 px-4">{teacher.residence}</td>
                      <td className="py-3 px-4">
                        {teacher.paymentType === "fixe" ? (
                          <div>
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">Fixe</span>
                            <div className="text-xs text-muted-foreground">{teacher.salary}€/mois</div>
                          </div>
                        ) : (
                          <div>
                            <span className="px-2 py-1 bg-secondary/20 text-secondary-foreground rounded text-xs">Horaire</span>
                            <div className="text-xs text-muted-foreground">{teacher.hourlyRate}€/h</div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs">
                          {teacher.yearsExperience} ans
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" aria-label="Voir" onClick={() => setViewingTeacher(teacher)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label="Modifier" onClick={() => setEditingTeacher(teacher)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => handleDelete(teacher.id)}>
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

      {editingTeacher && (
        <EditTeacherModal
          teacher={editingTeacher}
          subjects={subjects}
          onSave={handleSaveEdit}
          onCancel={() => setEditingTeacher(null)}
        />
      )}

      {viewingTeacher && (
        <ViewTeacherModal
          teacher={viewingTeacher}
          subjects={subjects}
          onClose={() => setViewingTeacher(null)}
        />
      )}
    </div>
  );
}

interface EditTeacherModalProps {
  teacher: Teacher;
  subjects: Subject[];
  onSave: (teacher: Teacher) => void;
  onCancel: () => void;
}

function EditTeacherModal({ teacher, subjects, onSave, onCancel }: EditTeacherModalProps) {
  const [formData, setFormData] = useState<Teacher>(teacher);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-border shadow-sm">
        <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Modifier le Professeur</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Prénom</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Nom</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Téléphone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Résidence</label>
              <input
                type="text"
                value={formData.residence || ""}
                onChange={(e) => setFormData({ ...formData, residence: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Années d'expérience</label>
              <input
                type="number"
                min={0}
                value={formData.yearsExperience || 0}
                onChange={(e) =>
                  setFormData({ ...formData, yearsExperience: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                required
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" className="flex-1">Sauvegarder</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ViewTeacherModalProps {
  teacher: Teacher;
  subjects: Subject[];
  onClose: () => void;
}

function ViewTeacherModal({ teacher, subjects, onClose }: ViewTeacherModalProps) {
  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject ? subject.name : subjectId;
  };
  const getContactTypeName = (contactType: string) => {
    const types = {
      telephone: "Téléphone",
      email: "Email",
      whatsapp: "WhatsApp",
      sms: "SMS",
    } as const;
    return (types as any)[contactType] || contactType;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-border shadow-sm">
        <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Profil du Professeur</h2>

        <div className="space-y-6">
          <section className="border-b border-border pb-4">
            <h3 className="text-lg font-semibold text-foreground mb-3">Informations Personnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/40 p-4 rounded-md">
                <h4 className="font-medium text-muted-foreground mb-1">Nom complet</h4>
                <p className="text-foreground">{teacher.firstName} {teacher.lastName}</p>
              </div>
              <div className="bg-muted/40 p-4 rounded-md">
                <h4 className="font-medium text-muted-foreground mb-1">Genre</h4>
                <p>{teacher.gender === "homme" ? "Homme" : "Femme"}</p>
              </div>
              <div className="bg-muted/40 p-4 rounded-md">
                <h4 className="font-medium text-muted-foreground mb-1">Nationalité</h4>
                <p>{teacher.nationality || "Non renseignée"}</p>
              </div>
              <div className="bg-muted/40 p-4 rounded-md">
                <h4 className="font-medium text-muted-foreground mb-1">Résidence</h4>
                <p>{teacher.residence || "Non renseignée"}</p>
              </div>
            </div>
          </section>

          <section className="border-b border-border pb-4">
            <h3 className="text-lg font-semibold text-foreground mb-3">Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/40 p-4 rounded-md">
                <h4 className="font-medium text-muted-foreground mb-1">Email</h4>
                <p className="text-primary">{teacher.email}</p>
              </div>
              <div className="bg-muted/40 p-4 rounded-md">
                <h4 className="font-medium text-muted-foreground mb-1">Téléphone</h4>
                <p>{teacher.phone}</p>
              </div>
              <div className="bg-muted/40 p-4 rounded-md">
                <h4 className="font-medium text-muted-foreground mb-1">Contact préféré</h4>
                <p>{getContactTypeName(teacher.contactType || "telephone")}</p>
              </div>
              <div className="bg-muted/40 p-4 rounded-md">
                <h4 className="font-medium text-muted-foreground mb-1">Contact d'urgence</h4>
                <p>{teacher.emergencyContact || "Non renseigné"}</p>
                <p className="text-xs text-muted-foreground">{teacher.emergencyPhone || ""}</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3">Informations Professionnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/40 p-4 rounded-md">
                <h4 className="font-medium text-muted-foreground mb-1">Matière</h4>
                <p className="font-medium">{getSubjectName(teacher.subject)}</p>
              </div>
              <div className="bg-muted/40 p-4 rounded-md">
                <h4 className="font-medium text-muted-foreground mb-1">Expérience</h4>
                <p>{teacher.yearsExperience || 0} ans</p>
              </div>
              <div className="bg-muted/40 p-4 rounded-md">
                <h4 className="font-medium text-muted-foreground mb-1">Type de rémunération</h4>
                <p className="capitalize">{teacher.paymentType || "fixe"}</p>
              </div>
              <div className="bg-muted/40 p-4 rounded-md">
                <h4 className="font-medium text-muted-foreground mb-1">Rémunération</h4>
                {teacher.paymentType === "horaire" ? (
                  <p className="text-green-700 font-semibold">{teacher.hourlyRate || 0}€/heure</p>
                ) : (
                  <p className="text-green-700 font-semibold">{teacher.salary || 0}€/mois</p>
                )}
              </div>
            </div>
          </section>

          <Button onClick={onClose} className="w-full" variant="secondary">Fermer</Button>
        </div>
      </div>
    </div>
  );
}
