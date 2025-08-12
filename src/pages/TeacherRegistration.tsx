import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

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

export default function TeacherRegistration() {
  const [formData, setFormData] = useState<Omit<Teacher, "id">>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    hireDate: "",
    paymentType: "fixe",
    salary: 0,
    hourlyRate: 0,
    gender: "homme",
    residence: "",
    contactType: "telephone",
    yearsExperience: 0,
    nationality: "",
    emergencyContact: "",
    emergencyPhone: "",
  });

  const [subjects] = useState<Subject[]>([
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
  ]);

  const [message, setMessage] = useState("");
  const [nextId, setNextId] = useState(0);

  useEffect(() => {
    document.title = "Inscription Professeurs — École Manager";
    const savedTeachers = JSON.parse(localStorage.getItem("teachers") || "[]");
    const numericIds = Array.isArray(savedTeachers)
      ? savedTeachers.map((t: any) => (typeof t?.id === "string" && /^\d+$/.test(t.id) ? parseInt(t.id, 10) : -1))
      : [];
    const maxId = numericIds.length ? Math.max(...numericIds) : -1;
    setNextId((isFinite(maxId) ? maxId : -1) + 1);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone ||
      !formData.subject ||
      !formData.hireDate ||
      !formData.residence ||
      !formData.nationality ||
      !formData.emergencyContact ||
      !formData.emergencyPhone
    ) {
      setMessage("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const newTeacher: Teacher = {
      id: nextId.toString(),
      ...formData,
    };

    const existingTeachers = JSON.parse(localStorage.getItem("teachers") || "[]");
    const updatedTeachers = [...existingTeachers, newTeacher];
    localStorage.setItem("teachers", JSON.stringify(updatedTeachers));
    setNextId((prev) => prev + 1);


    setMessage("Professeur inscrit avec succès!");
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      subject: "",
      hireDate: "",
      paymentType: "fixe",
      salary: 0,
      hourlyRate: 0,
      gender: "homme",
      residence: "",
      contactType: "telephone",
      yearsExperience: 0,
      nationality: "",
      emergencyContact: "",
      emergencyPhone: "",
    });

    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-6xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center text-foreground animate-slide-up">
          Inscription des Professeurs
        </h1>

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

        <div className="bg-card rounded-lg shadow-sm p-6 md:p-8 border border-border hover-glow">
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

          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="border-b border-border pb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
                Informations Personnelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Prénom *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Nom *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Genre *</label>
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

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Nationalité *</label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                    placeholder="Ex: Française, Marocaine, etc."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Résidence *</label>
                  <input
                    type="text"
                    value={formData.residence}
                    onChange={(e) => setFormData({ ...formData, residence: e.target.value })}
                    className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                    placeholder="Ville, Pays"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Années d'expérience *</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.yearsExperience}
                    onChange={(e) =>
                      setFormData({ ...formData, yearsExperience: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                    required
                  />
                </div>
              </div>
            </section>

            <section className="border-b border-border pb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
                Informations de Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Téléphone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Type de contact préféré *</label>
                  <select
                    value={formData.contactType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactType: e.target.value as "telephone" | "email" | "whatsapp" | "sms",
                      })
                    }
                    className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                    required
                  >
                    <option value="telephone">Téléphone</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Contact d'urgence *</label>
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                    placeholder="Nom du contact d'urgence"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Téléphone d'urgence *</label>
                  <input
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                    required
                  />
                </div>
              </div>
            </section>

            <section className="border-b border-border pb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
                Informations Professionnelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Matière enseignée *</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                    required
                  >
                    <option value="">Sélectionner une matière</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Date d'embauche *</label>
                  <input
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Type de rémunération *</label>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 text-foreground">
                      <input
                        type="radio"
                        value="fixe"
                        checked={formData.paymentType === "fixe"}
                        onChange={(e) =>
                          setFormData({ ...formData, paymentType: e.target.value as "fixe" | "horaire" })
                        }
                        className="h-4 w-4"
                      />
                      <span>Salaire fixe</span>
                    </label>
                    <label className="flex items-center gap-2 text-foreground">
                      <input
                        type="radio"
                        value="horaire"
                        checked={formData.paymentType === "horaire"}
                        onChange={(e) =>
                          setFormData({ ...formData, paymentType: e.target.value as "fixe" | "horaire" })
                        }
                        className="h-4 w-4"
                      />
                      <span>Tarif horaire</span>
                    </label>
                  </div>
                </div>

                {formData.paymentType === "fixe" && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Salaire mensuel (€)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.salary}
                      onChange={(e) =>
                        setFormData({ ...formData, salary: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                      placeholder="Montant en €"
                    />
                  </div>
                )}

                {formData.paymentType === "horaire" && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Tarif horaire (€)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={formData.hourlyRate}
                      onChange={(e) =>
                        setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                      placeholder="Montant par heure"
                    />
                  </div>
                )}
              </div>
            </section>

            <Button type="submit" className="w-full">👨‍🏫 Inscrire le Professeur</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
