import { useMemo, useState } from "react";
import SEO from "@/components/SEO";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getClasses, getServices } from "@/lib/paymentsLocal";
import { isServiceActive, setServiceActive, bulkSetServiceActive } from "@/lib/paymentsActivations";

// Types
type Classe = { id: string; nom: string };
type Eleve = { id: string; prenom: string; nom: string; classeId: string };
type Service = { id: string; nom: string; montant: number };

const MONTHS = [
  { value: "01", label: "Janvier" },
  { value: "02", label: "Février" },
  { value: "03", label: "Mars" },
  { value: "04", label: "Avril" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Juin" },
  { value: "07", label: "Juillet" },
  { value: "08", label: "Août" },
  { value: "09", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
];

export default function StudentsServicesManage() {
  const canonical = typeof window !== "undefined" ? window.location.origin + "/payments/students/services/manage" : undefined;

  const [classes] = useState<Classe[]>(() => getClasses());
  const [services] = useState<Service[]>(() => getServices());
  const [classeId, setClasseId] = useState<string>("");
  const [serviceId, setServiceId] = useState<string>("");
  const [mois, setMois] = useState<string>("");
  const [version, setVersion] = useState(0);

  const students = useMemo<Eleve[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("students") || "[]");
      if (!Array.isArray(saved)) return [];
      return saved
        .map((s: any) => ({
          id: String(s.id),
          prenom: String(s.firstName ?? s.prenom ?? ""),
          nom: String(s.lastName ?? s.nom ?? ""),
          classeId: String(s.classId ?? s.classeId ?? ""),
        }))
        .filter((e: Eleve) => e.id && e.classeId);
    } catch { return []; }
  }, []);

  const studentsClasse = useMemo(() => students.filter((s) => s.classeId === classeId), [students, classeId, version]);

  const onToggle = (sid: string, active: boolean) => {
    if (!serviceId || !mois) return;
    setServiceActive(sid, serviceId, mois, active);
    setVersion((v) => v + 1);
  };

  const activateAll = () => {
    if (!classeId || !serviceId || !mois) return;
    bulkSetServiceActive(studentsClasse.map((s)=>s.id), serviceId, mois, true);
    setVersion((v) => v + 1);
  };

  return (
    <main className="animate-fade-in">
      <SEO
        title="Gérer services — Élèves"
        description="Activer ou désactiver un service par élève et par mois."
        canonical={canonical}
        jsonLd={{ "@context": "https://schema.org", "@type": "WebPage", name: "Gérer services (élèves)", url: canonical }}
      />

      <header className="mb-6">
        <h1 className="text-2xl font-bold">Gérer — Services (Élèves)</h1>
      </header>

      <Card className="border">
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="text-sm font-medium">Classe</label>
              <Select value={classeId} onValueChange={setClasseId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir une classe" /></SelectTrigger>
                <SelectContent className="z-50">
                  {classes.map((c)=> (<SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Mois</label>
              <Select value={mois} onValueChange={(v)=>{ setMois(v); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir un mois" /></SelectTrigger>
                <SelectContent className="z-50">
                  {MONTHS.map((m)=> (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Service</label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir un service" /></SelectTrigger>
                <SelectContent className="z-50">
                  {services.map((s)=> (<SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mb-3">
            <Button onClick={activateAll} disabled={!classeId || !serviceId || !mois || studentsClasse.length===0}>Activer pour tous</Button>
          </div>

          <div className="rounded-lg border border-border bg-card overflow-x-auto">
            <Table className="whitespace-nowrap">
              <TableHeader>
                <TableRow>
                  <TableHead>ID Élève</TableHead>
                  <TableHead>Prénom</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!classeId || !serviceId || !mois ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">Sélectionnez une classe, un mois et un service.</TableCell>
                  </TableRow>
                ) : studentsClasse.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">Aucun élève dans cette classe.</TableCell>
                  </TableRow>
                ) : (
                  studentsClasse.map((e) => {
                    const active = isServiceActive(e.id, serviceId, mois);
                    return (
                      <TableRow key={e.id}>
                        <TableCell>{e.id}</TableCell>
                        <TableCell>{e.prenom}</TableCell>
                        <TableCell>{e.nom}</TableCell>
                        <TableCell>
                          {active ? <Badge variant="secondary">Activé</Badge> : <Badge variant="destructive">Désactivé</Badge>}
                        </TableCell>
                        <TableCell>
                          {active ? (
                            <Button variant="outline" onClick={() => onToggle(e.id, false)}>Désactiver</Button>
                          ) : (
                            <Button onClick={() => onToggle(e.id, true)}>Activer</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
