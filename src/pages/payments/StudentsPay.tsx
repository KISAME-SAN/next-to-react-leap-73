import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import SEO from "@/components/SEO";
import { getClasses, getFeesAnnexes, getServices, getStudentFeesMap, addStudentPayment, sumPaidFor } from "@/lib/paymentsLocal";
import { useToast } from "@/components/ui/use-toast";
import { isFeeActive, isServiceActive } from "@/lib/paymentsActivations";

// Types mirrored from tracking
type Classe = { id: string; nom: string };
type Eleve = { id: string; prenom: string; nom: string; classeId: string };
type PaiementType = "inscription" | "mensualite" | "frais" | "service";
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

export default function StudentsPay() {
  const canonical = typeof window !== "undefined" ? window.location.origin + "/payments/students/pay" : undefined;
  const { toast } = useToast();

  const [classes] = useState<Classe[]>(() => getClasses());
  const [fraisAnnexes] = useState<FraisAnnexe[]>(() => getFeesAnnexes());
  const [services] = useState<Service[]>(() => getServices());
  const [feesMap] = useState<FeesMap>(() => getStudentFeesMap());

  const students = useMemo<Eleve[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("students") || "[]");
      if (!Array.isArray(saved)) return [];
      return saved.map((s: any) => ({
        id: String(s.id),
        prenom: String(s.firstName ?? s.prenom ?? ""),
        nom: String(s.lastName ?? s.nom ?? ""),
        classeId: String(s.classId ?? s.classeId ?? ""),
      })).filter((e: Eleve) => e.id && e.classeId);
    } catch { return []; }
  }, []);

  const [studentId, setStudentId] = useState("");
  const eleve = students.find((e) => e.id === studentId);

  const [type, setType] = useState<PaiementType | "">("");
  const [mois, setMois] = useState("");
  const [fraisId, setFraisId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState("");
  const [version, setVersion] = useState(0);
  const due = useMemo(() => {
    if (!eleve || !type) return 0;
    if (type === "inscription") return feesMap[eleve.classeId]?.inscription || 0;
    if (type === "mensualite") return feesMap[eleve.classeId]?.mensualite || 0;
    if (type === "frais") {
      const f = fraisAnnexes.find((x) => x.id === fraisId); return f?.montant || 0;
    }
    if (type === "service") {
      const s = services.find((x) => x.id === serviceId); return s?.montant || 0;
    }
    return 0;
  }, [eleve, type, fraisId, serviceId, fraisAnnexes, services, feesMap]);

  const alreadyPaid = useMemo(() => {
    if (!eleve || !type) return 0;
    if (type === "inscription") return sumPaidFor({ studentId: eleve.id, type: "inscription", classeId: eleve.classeId }).total;
    if (type === "mensualite" && mois) return sumPaidFor({ studentId: eleve.id, type: "mensualite", classeId: eleve.classeId, mois }).total;
    if (type === "frais" && fraisId) return sumPaidFor({ studentId: eleve.id, type: "frais", itemId: fraisId }).total;
    if (type === "service" && serviceId && mois) return sumPaidFor({ studentId: eleve.id, type: "service", itemId: serviceId, mois }).total;
    return 0;
  }, [eleve, type, mois, fraisId, serviceId, version]);

  const restant = Math.max(due - alreadyPaid, 0);

  const selectionComplete = useMemo(() => {
    if (!eleve || !type) return false;
    if (type === "inscription") return true;
    if (type === "mensualite") return !!mois;
    if (type === "frais") return !!fraisId;
    if (type === "service") return !!serviceId && !!mois;
    return false;
  }, [eleve, type, mois, fraisId, serviceId]);

  const onPay = () => {
    if (!eleve) {
      toast({ variant: "destructive", title: "ID élève invalide", description: "Aucun élève trouvé pour cet ID." });
      return;
    }
    if (!type) {
      toast({ variant: "destructive", title: "Type requis", description: "Choisissez un type de paiement." });
      return;
    }
    if (type === "mensualite" && !mois) {
      toast({ variant: "destructive", title: "Mois requis", description: "Sélectionnez un mois pour la mensualité." });
      return;
    }
    if (type === "frais" && !fraisId) {
      toast({ variant: "destructive", title: "Frais requis", description: "Sélectionnez un frais annexe." });
      return;
    }
    if (type === "service" && (!serviceId || !mois)) {
      toast({ variant: "destructive", title: "Champs requis", description: "Sélectionnez un service et un mois." });
      return;
    }

    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast({ variant: "destructive", title: "Montant invalide", description: "Entrez un montant supérieur à 0." });
      return;
    }
    if (amt > restant) {
      toast({ variant: "destructive", title: "Montant trop élevé", description: "Le montant dépasse le restant dû." });
      return;
    }

    // méthode requise
    if (!method) {
      toast({ variant: "destructive", title: "Méthode requise", description: "Sélectionnez une méthode de paiement." });
      return;
    }

    // record transaction
    addStudentPayment({
      studentId: eleve.id,
      type: type as any,
      classeId: eleve.classeId,
      mois: type === "mensualite" || type === "service" ? mois : undefined,
      itemId: type === "frais" ? fraisId : type === "service" ? serviceId : undefined,
      amount: amt,
      method,
    });

    toast({ title: "Paiement enregistré", description: `${formatXOF(amt)} pour ${type}.` });
    setAmount("");
    setVersion((v) => v + 1);
  };

  return (
    <main className="animate-fade-in">
      <SEO
        title="Verser un paiement — Élèves"
        description="Enregistrer un paiement pour un élève: inscription, mensualité, frais annexes ou services."
        canonical={canonical}
        jsonLd={{ "@context": "https://schema.org", "@type": "WebPage", name: "Verser un paiement (élèves)", url: canonical }}
      />

      <header className="mb-6">
        <h1 className="text-2xl font-bold">Verser un paiement (Élèves)</h1>
      </header>

      <Card className="border">
        <CardHeader>
          <CardTitle>Informations de paiement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="studentId">ID Élève</Label>
              <Input id="studentId" placeholder="Ex: 123" value={studentId} onChange={(e) => setStudentId(e.target.value.trim())} className="mt-1" />
              {eleve ? (
                <p className="text-sm text-muted-foreground mt-1">{eleve.prenom} {eleve.nom} — Classe: {classes.find((c) => c.id === eleve.classeId)?.nom || eleve.classeId}</p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">Saisissez un ID et assurez-vous qu'il existe.</p>
              )}
            </div>

            <div>
              <Label>Type de paiement</Label>
              <Select value={type} onValueChange={(v) => { setType(v as PaiementType); setMois(""); setFraisId(""); setServiceId(""); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="inscription">Frais d'inscription</SelectItem>
                  <SelectItem value="mensualite">Mensualité</SelectItem>
                  <SelectItem value="frais">Frais annexes</SelectItem>
                  <SelectItem value="service">Services</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === "mensualite" && (
              <div>
                <Label>Mois</Label>
                <Select value={mois} onValueChange={setMois}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir un mois" /></SelectTrigger>
                  <SelectContent className="z-50">
                    {MONTHS.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {type === "frais" && (
              <div>
                <Label>Frais annexe</Label>
                <Select value={fraisId} onValueChange={setFraisId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir un frais" /></SelectTrigger>
                  <SelectContent className="z-50">
                    {eleve && fraisAnnexes.filter((f)=> isFeeActive(eleve.id, f.id)).map((f) => (<SelectItem key={f.id} value={f.id}>{f.nom}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {type === "service" && (
              <>
                <div>
                  <Label>Mois</Label>
                  <Select value={mois} onValueChange={(v)=>{ setMois(v); setServiceId(""); }}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Mois" /></SelectTrigger>
                    <SelectContent className="z-50">
                      {MONTHS.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Service</Label>
                  <Select value={serviceId} onValueChange={setServiceId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir un service" /></SelectTrigger>
                    <SelectContent className="z-50">
                      {eleve && mois && services.filter((s)=> isServiceActive(eleve.id, s.id, mois)).map((s) => (<SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div>
              <Label>Méthode de paiement</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir une méthode" /></SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="cash">Espèces (Cash)</SelectItem>
                  <SelectItem value="wave">Wave</SelectItem>
                  <SelectItem value="orange-money">Orange Money</SelectItem>
                  <SelectItem value="virement">Virement</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Montant versé</Label>
              <Input type="number" min={0} step="100" inputMode="numeric" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1" />
              {selectionComplete && (
                <p className="text-xs text-muted-foreground mt-1">Dû: {formatXOF(due)} — Déjà payé: {formatXOF(alreadyPaid)} — Restant: {formatXOF(restant)}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={onPay} disabled={!eleve || !type || !selectionComplete || !method || Number(amount) <= 0}>Payer</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
