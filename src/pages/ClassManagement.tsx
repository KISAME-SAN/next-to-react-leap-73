import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { getEnrollments } from "@/lib/students";
import { getActiveYearId } from "@/lib/years";

interface ClassItem {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  createdAt: string;
}

const STORAGE_KEY = "classes";

export default function ClassManagement() {
  // SEO basics
  useEffect(() => {
    document.title = "Gestion des Classes | École Manager";
    const desc =
      "Gestion des Classes: créer, modifier et supprimer des classes scolaires";
    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]'
    );
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = desc;

    // canonical
    let link = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]'
    );
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = window.location.href;
  }, []);

  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ClassItem | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setClasses(saved);
    } catch {
      setClasses([]);
    }
  }, []);

  const saveToStorage = (list: ClassItem[]) => {
    setClasses(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const handleCreate = (data: Omit<ClassItem, "id" | "createdAt">) => {
    const item: ClassItem = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...data,
    };
    const updated = [...classes, item];
    saveToStorage(updated);
    setCreateOpen(false);
    toast({ title: "Classe créée", description: `${item.name} a été ajoutée.` });
  };

  const handleUpdate = (data: ClassItem) => {
    const updated = classes.map((c) => (c.id === data.id ? data : c));
    saveToStorage(updated);
    setEditing(null);
    toast({ title: "Classe modifiée", description: `${data.name} mise à jour.` });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette classe ?")) return;
    const updated = classes.filter((c) => c.id !== id);
    saveToStorage(updated);
    toast({ title: "Classe supprimée" });
  };

  const getStudentCount = (classId: string) => {
    try {
      // Use yearly enrollments instead of legacy student.classId
      const list = getEnrollments(getActiveYearId());
      return list.filter((e: any) => e.classId === classId).length;
    } catch {
      return 0;
    }
  };

  const stats = useMemo(() => {
    if (classes.length === 0) return { total: 0, capacity: 0, enrolled: 0 };
    const total = classes.length;
    const capacity = classes.reduce((sum, c) => sum + (c.capacity || 0), 0);
    const enrolled = classes.reduce(
      (sum, c) => sum + getStudentCount(c.id),
      0
    );
    return { total, capacity, enrolled };
  }, [classes]);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Gestion des Classes
        </h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Créer une classe
        </Button>
      </header>

      {/* Small stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Nombre de classes</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.total}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Capacité totale</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.capacity}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Élèves inscrits</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.enrolled}</CardContent>
        </Card>
      </section>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground mb-4">
              Aucune classe créée pour le moment.
            </p>
            <Button onClick={() => setCreateOpen(true)}>Créer votre première classe</Button>
          </CardContent>
        </Card>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
          {classes.map((cls) => {
            const enrolled = getStudentCount(cls.id);
            const percent = Math.min(
              Math.round(((enrolled || 0) / (cls.capacity || 1)) * 100),
              100
            );
            return (
              <Card key={cls.id} className="flex flex-col hover-lift">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg font-semibold">
                      {cls.name}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Button variant="secondary" size="icon" onClick={() => setEditing(cls)} aria-label="Modifier">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(cls.id)} aria-label="Supprimer">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cls.description ? (
                    <p className="text-sm text-muted-foreground">{cls.description}</p>
                  ) : null}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Capacité</span>
                      <span className="font-medium">{cls.capacity} élèves</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Élèves inscrits</span>
                      <span className="font-medium">{enrolled} élèves</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Créée le</span>
                      <span className="font-medium">
                        {new Date(cls.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <Progress value={percent} aria-label={`Remplissage ${percent}%`} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {percent}% de remplissage
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}

      {/* Create */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une nouvelle classe</DialogTitle>
          </DialogHeader>
          <ClassForm onCancel={() => setCreateOpen(false)} onSave={handleCreate} />
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la classe</DialogTitle>
          </DialogHeader>
          {editing && (
            <ClassForm
              initialData={editing}
              onCancel={() => setEditing(null)}
              onSave={(data) =>
                handleUpdate({ ...editing, ...data, capacity: Number(data.capacity) })
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ClassFormValues {
  name: string;
  description?: string;
  capacity: number;
}

function ClassForm({
  initialData,
  onSave,
  onCancel,
}: {
  initialData?: ClassFormValues;
  onSave: (data: ClassFormValues) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ClassFormValues>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    capacity: Number(initialData?.capacity || 30),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({ ...form, capacity: Number(form.capacity) });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom de la classe *</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          placeholder="Ex: 6ème A, CM2, Terminale..."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="desc">Description (optionnel)</Label>
        <Textarea
          id="desc"
          value={form.description}
          onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
          rows={3}
          placeholder="Description de la classe..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="capacity">Capacité maximale *</Label>
        <Input
          id="capacity"
          type="number"
          min={1}
          max={1000}
          value={form.capacity}
          onChange={(e) => setForm((s) => ({ ...s, capacity: Number(e.target.value) }))}
          required
        />
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">Enregistrer</Button>
      </DialogFooter>
    </form>
  );
}
