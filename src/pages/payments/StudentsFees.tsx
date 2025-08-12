import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SEO from "@/components/SEO";
import { useToast } from "@/components/ui/use-toast";

 type FraisAnnexe = { id: string; nom: string; montant: number };
 const KEY = "studentsExtraFees";
 const formatXOF = (v: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(v || 0);

export default function StudentsFees() {
  const { toast } = useToast();
  const canonical = typeof window !== "undefined" ? window.location.origin + "/payments/students/fees" : undefined;

  const [fraisAnnexes, setFraisAnnexes] = useState<FraisAnnexe[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
      setFraisAnnexes(Array.isArray(saved) ? saved : []);
    } catch { setFraisAnnexes([]); }
  }, []);

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setAmount("");
    setOpen(true);
  };

  const openEdit = (item: FraisAnnexe) => {
    setEditingId(item.id);
    setName(item.nom);
    setAmount(String(item.montant));
    setOpen(true);
  };

  const persist = (items: FraisAnnexe[]) => {
    setFraisAnnexes(items);
    localStorage.setItem(KEY, JSON.stringify(items));
  };

  const save = () => {
    const nom = name.trim();
    const m = Number(amount);
    if (!nom || isNaN(m) || m < 0) {
      toast({ title: "Vérifiez les champs", description: "Nom et montant (>= 0) sont requis.", variant: "destructive" });
      return;
    }

    if (isEditing && editingId) {
      const next = fraisAnnexes.map((it) => it.id === editingId ? { ...it, nom, montant: m } : it);
      persist(next);
      toast({ title: "Frais annexe mis à jour", description: `${nom} — ${formatXOF(m)}` });
    } else {
      const next: FraisAnnexe[] = [...fraisAnnexes, { id: `f${Date.now()}`, nom, montant: m }];
      persist(next);
      toast({ title: "Frais annexe créé", description: `${nom} — ${formatXOF(m)}` });
    }

    setOpen(false); setName(""); setAmount(""); setEditingId(null);
  };

  const remove = (id: string) => {
    const item = fraisAnnexes.find((x) => x.id === id);
    const next = fraisAnnexes.filter((x) => x.id !== id);
    persist(next);
    toast({ title: "Frais annexe supprimé", description: item ? item.nom : undefined, variant: "destructive" });
  };

  return (
    <main className="animate-fade-in">
      <SEO title="Frais annexes — Élèves" description="Créer, éditer et supprimer les frais ponctuels (FCFA)." canonical={canonical} jsonLd={{"@context":"https://schema.org","@type":"WebPage",name:"Frais annexes élèves",url:canonical}} />

      <header className="mb-6">
        <h1 className="text-2xl font-bold">Frais annexes (Élèves)</h1>
      </header>

      <Card className="border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Frais annexes</CardTitle>
          <div className="flex gap-2">
            <Button onClick={openCreate}>Créer</Button>
            <Link to="/payments/students/fees/manage"><Button variant="secondary">Gérer</Button></Link>
          </div>
        </CardHeader>
        <CardContent>
          {fraisAnnexes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun frais annexe. Cliquez sur "Créer" pour ajouter.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {fraisAnnexes.map((f)=> (
                <div key={f.id} className="rounded-lg border border-border p-4 bg-card flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">{f.nom}</h3>
                    <p className="text-sm"><span className="font-medium text-info">Montant {formatXOF(f.montant)}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => openEdit(f)}>Configurer</Button>
                    <Button variant="destructive" onClick={() => remove(f.id)}>Supprimer</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(o)=>{ if(!o) setOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Modifier un frais annexe" : "Créer un frais annexe"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label htmlFor="frais-nom">Nom</Label>
              <Input id="frais-nom" value={name} onChange={(e)=>setName(e.target.value)} className="mt-1" placeholder="Ex: Tenue scolaire" />
            </div>
            <div>
              <Label htmlFor="frais-montant">Montant (FCFA)</Label>
              <Input id="frais-montant" type="number" min={0} value={amount} onChange={(e)=>setAmount(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setOpen(false)}>Annuler</Button>
            <Button onClick={save}>{isEditing ? "Enregistrer" : "Créer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
