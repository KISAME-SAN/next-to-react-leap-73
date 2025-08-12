import { useState } from "react";
import { Button } from "@/components/ui/button";

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

interface EditStudentModalProps {
  student: Student;
  classes: Class[];
  onSave: (student: Student) => void;
  onCancel: () => void;
}

export default function EditStudentModal({ student, classes, onSave, onCancel }: EditStudentModalProps) {
  const [formData, setFormData] = useState<Student>(student);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-sm animate-enter hover-glow">
        <h2 className="text-2xl font-bold mb-4 text-foreground whitespace-nowrap">Modifier l'élève</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2 whitespace-nowrap">Prénom</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2 whitespace-nowrap">Nom</label>
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
              <label className="block text-sm font-medium text-muted-foreground mb-2 whitespace-nowrap">Date de Naissance</label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2 whitespace-nowrap">Numéro Élève</label>
              <input
                type="text"
                value={formData.studentNumber || ""}
                onChange={(e) => setFormData({ ...formData, studentNumber: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2 whitespace-nowrap">Téléphone Parent</label>
              <input
                type="tel"
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2 whitespace-nowrap">Genre</label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value as "homme" | "femme" })
                }
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                required
              >
                <option value="homme">Homme</option>
                <option value="femme">Femme</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2 whitespace-nowrap">Classe</label>
            <select
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
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

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit">Sauvegarder</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
