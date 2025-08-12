import { useMemo, useState } from "react";
import SEO from "@/components/SEO";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { getActiveYear, getActiveYearId } from "@/lib/years";
import { enrollStudent, getEnrollmentForStudent, getStudents } from "@/lib/students";
import { getClasses } from "@/lib/paymentsLocal";

export default function ReenrollmentById() {
  const year = getActiveYear();
  const canonical = typeof window !== "undefined" ? window.location.origin + "/students/reenroll" : undefined;

  const [id, setId] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const students = useMemo(() => getStudents(), []);
  const student = useMemo(() => students.find((s) => s.id === id.trim()), [students, id]);
  const classes = useMemo(() => getClasses(), [year?.id]);
  const existing = useMemo(() => (student ? getEnrollmentForStudent(student.id, getActiveYearId()) : undefined), [student]);

  const handleEnroll = () => {
    setMessage("");
    if (!student) { setMessage("Élève introuvable."); return; }
    if (!selectedClass) { setMessage("Veuillez choisir une classe."); return; }
    enrollStudent({ studentId: student.id, classId: selectedClass });
    setMessage("Inscription enregistrée pour l'année active.");
  };

  return (
    <main>
      <SEO title="Réinscription par ID — Élèves" description="Réinscrire rapidement un élève existant via son identifiant unique." canonical={canonical} jsonLd={{"@context":"https://schema.org","@type":"WebPage",name:"Réinscription par ID",url:canonical}} />

      <header className="mb-6">
        <h1 className="text-2xl font-bold">Réinscription par ID</h1>
        {year && <p className="text-sm text-muted-foreground mt-1">Année active: {year.nom}</p>}
      </header>

      <Card className="border">
        <CardHeader>
          <CardTitle>Rechercher l'élève</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="studentId">ID de l'élève</Label>
              <Input id="studentId" placeholder="Ex: 000123" value={id} onChange={(e)=>setId(e.target.value)} />
            </div>
            <div>
              <Label>Classe (année active)</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choisir une classe" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {classes.map((c)=> (
                    <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={handleEnroll}>Enregistrer</Button>
            </div>
          </div>

          <div className="mt-4 min-h-[24px]">
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
          </div>

          {student && (
            <div className="mt-6 rounded-md border p-4">
              <p className="font-medium">Élève</p>
              <p className="text-sm text-muted-foreground">{student.firstName} {student.lastName} — ID: {student.id}</p>
              {existing && (
                <p className="text-sm text-muted-foreground mt-1">Déjà inscrit cette année dans la classe: {existing.classId}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
