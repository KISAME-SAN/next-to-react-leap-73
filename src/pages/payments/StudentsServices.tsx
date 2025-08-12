import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SEO from "@/components/SEO";
import { useToast } from "@/components/ui/use-toast";

 type Service = { id: string; nom: string; montant: number };
 const KEY = "studentsServices";
 const formatXOF = (v: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(v || 0);

export default function StudentsServices() {
  const { toast } = useToast();
  const canonical = typeof window !== "undefined" ? window.location.origin + "/payments/students/services" : undefined;

  const [services, setServices] = useState<Service[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
      setServices(Array.isArray(saved) ? saved : []);
    } catch { setServices([]); }
  }, []);

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setAmount("");
    setOpen(true);
  };

  const openEdit = (item: Service) => {
    setEditingId(item.id);
    setName(item.nom);
    setAmount(String(item.montant));
    setOpen(true);
  };

  const persist = (items: Service[]) => {
    setServices(items);
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
      const next = services.map((it) => it.id === editingId ? { ...it, nom, montant: m } : it);
      persist(next);
      toast({ title: "Service mis à jour", description: `${nom} — ${formatXOF(m)}` });
    } else {
      const next: Service[] = [...services, { id: `s${Date.now()}`, nom, montant: m }];
      persist(next);
      toast({ title: "Service créé", description: `${nom} — ${formatXOF(m)}` });
    }

    setOpen(false); setName(""); setAmount(""); setEditingId(null);
  };

  const remove = (id: string) => {
    const item = services.find((x) => x.id === id);
    const next = services.filter((x) => x.id !== id);
    persist(next);
    toast({ title: "Service supprimé", description: item ? item.nom : undefined, variant: "destructive" });
  };

  return (
    <main className="animate-fade-in">
      <SEO title="Services — Élèves" description="Créer, éditer et supprimer les services mensuels (FCFA)." canonical={canonical} jsonLd={{"@context":"https://schema.org","@type":"WebPage",name:"Services élèves",url:canonical}} />

      <header className="mb-6">
        <h1 className="text-2xl font-bold">Services (Élèves)</h1>
      </header>

      <Card className="border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Services</CardTitle>
          <div className="flex gap-2">
            <Button onClick={openCreate}>Créer</Button>
            <Link to="/payments/students/services/manage"><Button variant="secondary">Gérer</Button></Link>
          </div>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun service. Cliquez sur "Créer" pour ajouter.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((s)=> (
                <div key={s.id} className="rounded-lg border border-border p-4 bg-card flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">{s.nom}</h3>
                    <p className="text-sm"><span className="font-medium text-info">Montant {formatXOF(s.montant)}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => openEdit(s)}>Configurer</Button>
                    <Button variant="destructive" onClick={() => remove(s.id)}>Supprimer</Button>
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
            <DialogTitle>{isEditing ? "Modifier un service" : "Créer un service"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label htmlFor="service-nom">Nom</Label>
              <Input id="service-nom" value={name} onChange={(e)=>setName(e.target.value)} className="mt-1" placeholder="Ex: Transport" />
            </div>
            <div>
              <Label htmlFor="service-montant">Montant mensuel (FCFA)</Label>
              <Input id="service-montant" type="number" min={0} value={amount} onChange={(e)=>setAmount(e.target.value)} className="mt-1" />
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
