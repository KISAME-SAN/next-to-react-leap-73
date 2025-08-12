import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import SEO from "@/components/SEO";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

 type ClassItem = { id: string; name: string };
 type Fees = { inscription: number; mensualite: number };
 const FEES_KEY = "studentFees";
 const formatXOF = (v: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(v || 0);

export default function StudentsConfiguration() {
  const { toast } = useToast();
  const canonical = typeof window !== "undefined" ? window.location.origin + "/payments/students/configuration" : undefined;

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [feesMap, setFeesMap] = useState<Record<string, Fees>>({});

  const [open, setOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState<ClassItem | null>(null);
  const [inscriptionStr, setInscriptionStr] = useState("");
  const [mensualiteStr, setMensualiteStr] = useState("");

  useEffect(() => {
    // Charger les classes depuis le stockage existant
    try {
      const raw = JSON.parse(localStorage.getItem("classes") || "[]");
      const mapped: ClassItem[] = Array.isArray(raw)
        ? raw.map((c: any) => ({ id: String(c.id), name: String(c.name || c.nom || "") })).filter((c) => c.id && c.name)
        : [];
      setClasses(mapped);
    } catch { setClasses([]); }

    // Charger la configuration des frais
    try {
      const f = JSON.parse(localStorage.getItem(FEES_KEY) || "{}");
      setFeesMap(f && typeof f === "object" ? f : {});
    } catch { setFeesMap({}); }
  }, []);

  const openModal = (cls: ClassItem) => {
    setCurrentClass(cls);
    const f = feesMap[cls.id] || { inscription: 0, mensualite: 0 };
    setInscriptionStr(String(f.inscription || ""));
    setMensualiteStr(String(f.mensualite || ""));
    setOpen(true);
  };

  const save = () => {
    const ins = Math.max(0, Number(inscriptionStr || 0));
    const men = Math.max(0, Number(mensualiteStr || 0));
    if (isNaN(ins) || isNaN(men)) {
      toast({ title: "Champs invalides", description: "Veuillez saisir des montants valides.", variant: "destructive" });
      return;
    }
    if (!currentClass) return;
    const next = { ...feesMap, [currentClass.id]: { inscription: ins, mensualite: men } } as Record<string, Fees>;
    setFeesMap(next);
    localStorage.setItem(FEES_KEY, JSON.stringify(next));
    toast({ title: "Montants enregistrés", description: `${currentClass.name} — Inscription ${formatXOF(ins)}, Mensualité ${formatXOF(men)}` });
    setOpen(false);
  };

  return (
    <main className="animate-fade-in">
      <SEO title="Configuration — Paiements Élèves" description="Définissez les montants d'inscription et de mensualité par classe (FCFA)." canonical={canonical} jsonLd={{"@context":"https://schema.org","@type":"WebPage",name:"Configuration paiements élèves",url:canonical}} />

      <header className="mb-6">
        <h1 className="text-2xl font-bold">Configuration (Élèves)</h1>
        <p className="text-muted-foreground mt-1">Montants en FCFA, valeurs négatives interdites.</p>
      </header>

      {classes.length === 0 ? (
        <Card className="border">
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground mb-4">Aucune classe existante. Créez d'abord vos classes.</p>
            <Button asChild variant="secondary"><Link to="/classes">Créer une classe</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border">
          <CardHeader>
            <CardTitle>Montants par classe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map((c) => {
                const f = feesMap[c.id] || { inscription: 0, mensualite: 0 };
                return (
                  <div key={c.id} className="rounded-lg border border-border p-4 bg-card flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">{c.name}</h3>
                      <p className="text-sm">
                        <span className="font-medium text-success">Inscription {formatXOF(f.inscription)}</span>
                        <span className="mx-2 text-muted-foreground">—</span>
                        <span className="font-medium text-info">Mensualité {formatXOF(f.mensualite)}</span>
                      </p>
                    </div>
                    <div>
                      <Button variant="secondary" onClick={() => openModal(c)}>Configurer</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={(o)=>{ if(!o) setOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurer les montants {currentClass ? `— ${currentClass.name}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div>
              <Label htmlFor="cfg-insc">Montant d'inscription</Label>
              <Input id="cfg-insc" type="number" min={0} value={inscriptionStr} onChange={(e)=>setInscriptionStr(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="cfg-mens">Montant de mensualité</Label>
              <Input id="cfg-mens" type="number" min={0} value={mensualiteStr} onChange={(e)=>setMensualiteStr(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setOpen(false)}>Annuler</Button>
            <Button onClick={save}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
