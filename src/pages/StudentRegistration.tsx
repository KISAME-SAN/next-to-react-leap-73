import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { upsertStudent, enrollStudent } from "@/lib/students";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  birthPlace: string;
  studentNumber?: string;
  parentPhone: string;
  gender: "homme" | "femme";
  classId: string;
}

interface Class {
  id: string;
  name: string;
}

export default function StudentRegistration() {
  const [formData, setFormData] = useState<Omit<Student, "id">>({
    firstName: "",
    lastName: "",
    birthDate: "",
    birthPlace: "",
    studentNumber: "",
    parentPhone: "",
    gender: "homme",
    classId: "",
  });
  const [classes, setClasses] = useState<Class[]>([]);
  const [message, setMessage] = useState("");
  const [nextId, setNextId] = useState(0);

  useEffect(() => {
    document.title = "Inscription Élève — École Manager";
    const savedClasses = JSON.parse(localStorage.getItem("classes") || "[]");
    setClasses(savedClasses);
    const savedStudents = JSON.parse(localStorage.getItem("students") || "[]");
    const numericIds = Array.isArray(savedStudents)
      ? savedStudents.map((s: any) => (typeof s?.id === "string" && /^\d+$/.test(s.id) ? parseInt(s.id, 10) : -1))
      : [];
    const maxId = numericIds.length ? Math.max(...numericIds) : -1;
    setNextId((isFinite(maxId) ? maxId : -1) + 1);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.birthDate ||
      !formData.birthPlace ||
      !formData.parentPhone ||
      !formData.classId
    ) {
      setMessage("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const newStudent: Student = { id: nextId.toString(), ...formData };

    try {
      // Sauvegarde dans le registre global
      upsertStudent(newStudent as any);
      // Crée l'inscription pour l'année active
      enrollStudent({ studentId: newStudent.id, classId: newStudent.classId });
      // Met à jour l'ID suivant
      setNextId((prev) => prev + 1);
      setMessage("Élève inscrit avec succès!");
    } catch {
      setMessage("Une erreur est survenue lors de l'inscription");
      return;
    }

    setFormData({
      firstName: "",
      lastName: "",
      birthDate: "",
      birthPlace: "",
      studentNumber: "",
      parentPhone: "",
      gender: "homme",
      classId: "",
    });

    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center">Inscription des Élèves</h1>

        <div className="flex justify-end mb-2">
          <div className="w-40">
            <label className="block text-xs font-medium text-muted-foreground mb-1">ID (auto)</label>
            <input
              type="text"
              value={nextId}
              readOnly
              disabled
              className="w-full px-3 py-2 border border-input rounded-md bg-muted/40 text-foreground"
            />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-8 border border-border hover-glow">
          {message && (
            <div
              className={`mb-6 p-4 rounded-md border ${
                message.includes("succès")
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-destructive/10 text-destructive border-destructive/30"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Prénom *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Nom *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Date de Naissance *</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Lieu de Naissance *</label>
                <input
                  type="text"
                  value={formData.birthPlace}
                  onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                  className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Numéro de l'Élève (optionnel)</label>
              <input
                type="text"
                value={formData.studentNumber}
                onChange={(e) => setFormData({ ...formData, studentNumber: e.target.value })}
                className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Téléphone Parent/Tuteur *</label>
                <input
                  type="tel"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Genre *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as "homme" | "femme" })}
                  className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                  required
                >
                  <option value="homme">Homme</option>
                  <option value="femme">Femme</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Classe *</label>
              <select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                required
              >
                <option value="">Sélectionner une classe</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" className="w-full">
              ✨ Inscrire l'Élève
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
