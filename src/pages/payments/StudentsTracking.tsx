import { useMemo, useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { getClasses, getFeesAnnexes, getServices, getStudentFeesMap, getStudentPayments, sumPaidFor } from "@/lib/paymentsLocal";
import { isFeeActive, isServiceActive } from "@/lib/paymentsActivations";
import { getActiveYearId } from "@/lib/years";
import { getEnrollments } from "@/lib/students";
 type Classe = { id: string; nom: string };
 type Eleve = { id: string; prenom: string; nom: string; classeId: string };
 type PaiementType = "inscription" | "mensualite" | "frais" | "service";
 type SortKey = "prenom" | "nom" | "methode" | "du" | "verse" | "restant" | "statut" | "date";
 type FraisAnnexe = { id: string; nom: string; montant: number };
 type Service = { id: string; nom: string; montant: number };
 type FeesMap = Record<string, { inscription: number; mensualite: number }>;
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
 const formatXOF = (v: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(v || 0);

export default function StudentsTracking() {
  const canonical = typeof window !== "undefined" ? window.location.origin + "/payments/students/tracking" : undefined;

  const [classes] = useState<Classe[]>(() => getClasses());
  const [activeYear, setActiveYear] = useState<string>(() => getActiveYearId());
  const [refresh, setRefresh] = useState(0);

  const eleves = useMemo<Eleve[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("students") || "[]");
      const enrollments = getEnrollments(activeYear);
      const emap = new Map<string, string>(enrollments.map((e) => [String(e.studentId), String(e.classId)]));
      if (!Array.isArray(saved)) return [];
      return saved
        .map((s: any) => {
          const sid = String(s.id);
          const cid = emap.get(sid) || ""; // uniquement la classe de l'année ACTIVE
          return {
            id: sid,
            prenom: String(s.firstName ?? s.prenom ?? ""),
            nom: String(s.lastName ?? s.nom ?? ""),
            classeId: String(cid),
          };
        })
        // On EXCLUT tout élève sans inscription dans l'année active
        .filter((e: Eleve) => e.id && e.classeId);
    } catch {
      return [];
    }
  }, [activeYear, refresh]);

  const [fraisAnnexes, setFraisAnnexes] = useState<FraisAnnexe[]>(() => getFeesAnnexes());
  const [services, setServices] = useState<Service[]>(() => getServices());
  const [feesMap, setFeesMap] = useState<FeesMap>(() => getStudentFeesMap());
  const [payments, setPayments] = useState<any[]>(() => getStudentPayments());
  const [classeFilter, setClasseFilter] = useState<string>("");
  const [typePaiement, setTypePaiement] = useState<PaiementType | "">("");
  const [mois, setMois] = useState<string>("");
  const [fraisId, setFraisId] = useState<string>("");
  const [serviceId, setServiceId] = useState<string>("");
  const [statutFilter, setStatutFilter] = useState<"tous" | "payé" | "partiel" | "non-payé">("tous");
  const [sortKey, setSortKey] = useState<SortKey>("prenom");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  // live update when payments/config/year/enrollments change
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      const key = e.key || "";
      // Defer updates to avoid interfering with open dropdown portals
      const run = () => {
        if (key === "activeYearId") {
          setActiveYear(getActiveYearId());
          setFraisAnnexes(getFeesAnnexes());
          setServices(getServices());
          setFeesMap(getStudentFeesMap());
          setPayments(getStudentPayments());
          return;
        }
        if (key.startsWith("studentPayments")) setPayments(getStudentPayments());
        if (key.startsWith("studentsExtraFees") || key.startsWith("studentsServices") || key.startsWith("studentFees")) {
          setFraisAnnexes(getFeesAnnexes());
          setServices(getServices());
          setFeesMap(getStudentFeesMap());
        }
        if (key.startsWith("enrollments")) setRefresh((v)=>v+1);
      };
      setTimeout(run, 0);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const pageSize = 20;

  type Row = { id: string; prenom: string; nom: string; methode: string; du: number; verse: number; restant: number; statut: "Payé" | "Partiel" | "Non payé"; date: string };

  const rows: Row[] = useMemo(() => {
    if (!classeFilter || !typePaiement) return [];
    const c = classes.find((cc) => cc.id === classeFilter);
    if (!c) return [];
    let due = 0;
    if (typePaiement === "inscription") {
      due = feesMap[classeFilter]?.inscription || 0;
    }
    if (typePaiement === "mensualite") {
      due = feesMap[classeFilter]?.mensualite || 0;
    }
    if (typePaiement === "frais") {
      const f = fraisAnnexes.find((x) => x.id === fraisId);
      if (!f) return [];
      due = f.montant;
    }
    if (typePaiement === "service") {
      const s = services.find((x) => x.id === serviceId);
      if (!s || !mois) return [];
      due = s.montant;
    }
    let elevesClasse = eleves.filter((e) => e.classeId === classeFilter);
    if (typePaiement === "frais" && fraisId) {
      elevesClasse = elevesClasse.filter((e)=> isFeeActive(e.id, fraisId));
    }
    if (typePaiement === "service" && serviceId && mois) {
      elevesClasse = elevesClasse.filter((e)=> isServiceActive(e.id, serviceId, mois));
    }
    const data = elevesClasse.map((e) => {
      let methode = "—";
      let paid = 0;
      let lastDate = "";
      if (typePaiement === "inscription") {
        const { total, last } = sumPaidFor({ studentId: e.id, type: "inscription", classeId: classeFilter });
        paid = total; methode = last?.method || "—"; lastDate = last?.date ? new Date(last.date).toLocaleDateString("fr-FR") : "";
      } else if (typePaiement === "mensualite") {
        const { total, last } = sumPaidFor({ studentId: e.id, type: "mensualite", classeId: classeFilter, mois });
        paid = total; methode = last?.method || "—"; lastDate = last?.date ? new Date(last.date).toLocaleDateString("fr-FR") : "";
      } else if (typePaiement === "frais") {
        const { total, last } = sumPaidFor({ studentId: e.id, type: "frais", itemId: fraisId });
        paid = total; methode = last?.method || "—"; lastDate = last?.date ? new Date(last.date).toLocaleDateString("fr-FR") : "";
      } else if (typePaiement === "service") {
        const { total, last } = sumPaidFor({ studentId: e.id, type: "service", itemId: serviceId, mois });
        paid = total; methode = last?.method || "—"; lastDate = last?.date ? new Date(last.date).toLocaleDateString("fr-FR") : "";
      }
      const restant = Math.max(due - paid, 0);
      const statut = paid >= due ? "Payé" : paid > 0 ? "Partiel" : "Non payé";
      const date = lastDate;
      return { id: e.id, prenom: e.prenom, nom: e.nom, methode, du: due, verse: paid, restant, statut, date } as Row;
    });
    const filtered = data.filter((r) =>
      statutFilter === "tous" ? true : statutFilter === "payé" ? r.statut === "Payé" : statutFilter === "partiel" ? r.statut === "Partiel" : r.statut === "Non payé"
    );
    const sorted = [...filtered].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return sorted;
  }, [classeFilter, typePaiement, fraisId, serviceId, mois, classes, eleves, services, fraisAnnexes, feesMap, payments, sortKey, sortDir, statutFilter, refresh]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const setSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  return (
    <main className="animate-fade-in">
      <SEO title="Suivi des paiements — Élèves" description="Filtres, tri, pagination et statuts automatiques pour le suivi des paiements." canonical={canonical} jsonLd={{"@context":"https://schema.org","@type":"WebPage",name:"Suivi paiements élèves",url:canonical}} />

      <header className="mb-6">
        <h1 className="text-2xl font-bold">Suivi des paiements (Élèves)</h1>
      </header>

      <Card className="border">
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
            <div className="md:col-span-1">
              <label className="text-sm font-medium">Classe (obligatoire)</label>
              <Select value={classeFilter} onValueChange={(v)=>{ setClasseFilter(v); setPage(1); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir une classe" /></SelectTrigger>
                <SelectContent className="z-50">
                  {classes.map((c)=> (<SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-1">
              <label className="text-sm font-medium">Type de paiement</label>
              <Select value={typePaiement} onValueChange={(v)=>{ setTypePaiement(v as PaiementType); setMois(""); setFraisId(""); setServiceId(""); setPage(1); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="inscription">Inscription</SelectItem>
                  <SelectItem value="mensualite">Mensualité</SelectItem>
                  <SelectItem value="frais">Frais annexes</SelectItem>
                  <SelectItem value="service">Services</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {typePaiement === "mensualite" && (
              <div className="md:col-span-1">
                <label className="text-sm font-medium">Mois</label>
                <Select value={mois} onValueChange={(v)=>{ setMois(v); setPage(1); }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir un mois" /></SelectTrigger>
                  <SelectContent className="z-50">
                    {MONTHS.map((m)=> (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {typePaiement === "frais" && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Frais annexe</label>
                <Select value={fraisId} onValueChange={(v)=>{ setFraisId(v); setPage(1); }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir un frais" /></SelectTrigger>
                  <SelectContent className="z-50">
                    {fraisAnnexes.map((f)=> (<SelectItem key={f.id} value={f.id}>{f.nom}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {typePaiement === "service" && (
              <>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Service</label>
                  <Select value={serviceId} onValueChange={(v)=>{ setServiceId(v); setPage(1); }}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir un service" /></SelectTrigger>
                    <SelectContent className="z-50">
                      {services.map((s)=> (<SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-1">
                  <label className="text-sm font-medium">Mois</label>
                  <Select value={mois} onValueChange={(v)=>{ setMois(v); setPage(1); }}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Mois" /></SelectTrigger>
                    <SelectContent className="z-50">
                      {MONTHS.map((m)=> (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="md:col-span-1">
              <label className="text-sm font-medium">Statut</label>
              <Select value={statutFilter} onValueChange={(v)=>{ setStatutFilter(v as any); setPage(1); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Tous" /></SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="tous">Tous</SelectItem>
                  <SelectItem value="payé">Payé</SelectItem>
                  <SelectItem value="partiel">Partiel</SelectItem>
                  <SelectItem value="non-payé">Non payé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card overflow-x-auto">
            <Table className="whitespace-nowrap">
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead className="cursor-pointer" onClick={()=>setSort("prenom")}>Prénom</TableHead>
                  <TableHead className="cursor-pointer" onClick={()=>setSort("nom")}>Nom</TableHead>
                  <TableHead className="cursor-pointer" onClick={()=>setSort("methode")}>Méthode de paiement</TableHead>
                  <TableHead className="cursor-pointer" onClick={()=>setSort("du")}>Montant dû</TableHead>
                  <TableHead className="cursor-pointer" onClick={()=>setSort("verse")}>Montant versé</TableHead>
                  <TableHead className="cursor-pointer" onClick={()=>setSort("restant")}>Montant restant</TableHead>
                  <TableHead className="cursor-pointer" onClick={()=>setSort("statut")}>Statut</TableHead>
                  <TableHead className="cursor-pointer" onClick={()=>setSort("date")}>Date de paiement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-6">Aucun résultat. Sélectionnez les filtres requis.</TableCell>
                  </TableRow>
                ) : (
                  pagedRows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.id}</TableCell>
                      <TableCell>{r.prenom}</TableCell>
                      <TableCell>{r.nom}</TableCell>
                      <TableCell>{r.methode}</TableCell>
                      <TableCell>{formatXOF(r.du)}</TableCell>
                      <TableCell>{formatXOF(r.verse)}</TableCell>
                      <TableCell>{formatXOF(r.restant)}</TableCell>
                      <TableCell>
                        {r.statut === "Payé" && <Badge variant="secondary">Payé</Badge>}
                        {r.statut === "Partiel" && <Badge>Partiel</Badge>}
                        {r.statut === "Non payé" && <Badge variant="destructive">Non payé</Badge>}
                      </TableCell>
                      <TableCell>{r.date}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {rows.length > pageSize && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Page {page} / {totalPages} — {rows.length} éléments</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={()=>setPage((p)=>Math.max(1,p-1))} disabled={page===1}>Précédent</Button>
                <Button variant="outline" onClick={()=>setPage((p)=>Math.min(totalPages,p+1))} disabled={page===totalPages}>Suivant</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
