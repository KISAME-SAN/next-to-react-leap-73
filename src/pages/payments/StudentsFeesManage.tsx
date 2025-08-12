import { useMemo, useState } from "react";
import SEO from "@/components/SEO";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getClasses, getFeesAnnexes } from "@/lib/paymentsLocal";
import { isFeeActive, setFeeActive, bulkSetFeeActive } from "@/lib/paymentsActivations";

// Types
type Classe = { id: string; nom: string };
type Eleve = { id: string; prenom: string; nom: string; classeId: string };
type FraisAnnexe = { id: string; nom: string; montant: number };

export default function StudentsFeesManage() {
  const canonical = typeof window !== "undefined" ? window.location.origin + "/payments/students/fees/manage" : undefined;

  const [classes] = useState<Classe[]>(() => getClasses());
  const [frais] = useState<FraisAnnexe[]>(() => getFeesAnnexes());
  const [classeId, setClasseId] = useState<string>("");
  const [fraisId, setFraisId] = useState<string>("");
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
    if (!fraisId) return;
    setFeeActive(sid, fraisId, active);
    setVersion((v) => v + 1);
  };

  const activateAll = () => {
    if (!classeId || !fraisId) return;
    bulkSetFeeActive(studentsClasse.map((s)=>s.id), fraisId, true);
    setVersion((v) => v + 1);
  };

  return (
    <main className="animate-fade-in">
      <SEO
        title="Gérer frais annexes — Élèves"
        description="Activer ou désactiver un frais annexe par élève."
        canonical={canonical}
        jsonLd={{ "@context": "https://schema.org", "@type": "WebPage", name: "Gérer frais annexes (élèves)", url: canonical }}
      />

      <header className="mb-6">
        <h1 className="text-2xl font-bold">Gérer — Frais annexes (Élèves)</h1>
      </header>

      <Card className="border">
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-sm font-medium">Classe</label>
              <Select value={classeId} onValueChange={setClasseId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir une classe" /></SelectTrigger>
                <SelectContent className="z-50">
                  {classes.map((c)=> (<SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Frais annexe</label>
              <Select value={fraisId} onValueChange={setFraisId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir un frais" /></SelectTrigger>
                <SelectContent className="z-50">
                  {frais.map((f)=> (<SelectItem key={f.id} value={f.id}>{f.nom}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mb-3">
            <Button onClick={activateAll} disabled={!classeId || !fraisId || studentsClasse.length===0}>Activer pour tous</Button>
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
                {!classeId || !fraisId ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">Sélectionnez une classe et un frais.</TableCell>
                  </TableRow>
                ) : studentsClasse.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">Aucun élève dans cette classe.</TableCell>
                  </TableRow>
                ) : (
                  studentsClasse.map((e) => {
                    const active = isFeeActive(e.id, fraisId);
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
