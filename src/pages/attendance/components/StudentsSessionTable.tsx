import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Eye } from "lucide-react";
import type { AttendanceStatus, Student } from "../types";

export type EntryValue = { status: AttendanceStatus; comment: string };

type StudentEx = Student & { birthDate?: string };

interface Props {
  students: StudentEx[];
  entries: Record<string, EntryValue>;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  onCommentChange: (studentId: string, comment: string) => void;
  locked?: boolean;
}

export default function StudentsSessionTable({ students, entries, onStatusChange, onCommentChange, locked }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const current = useMemo(() => (currentId ? (entries[currentId] || { status: "present" as AttendanceStatus, comment: "" }) : null), [currentId, entries]);
  const [modalStatus, setModalStatus] = useState<AttendanceStatus>("present");
  const [modalComment, setModalComment] = useState("");

  const openEdit = (id: string) => {
    setCurrentId(id);
    const v = entries[id] || { status: "present" as AttendanceStatus, comment: "" };
    setModalStatus(v.status);
    setModalComment(v.comment || "");
    setEditOpen(true);
  };
  const openView = (id: string) => {
    setCurrentId(id);
    setViewOpen(true);
  };

  const saveEdit = () => {
    if (!currentId) return;
    onStatusChange(currentId, modalStatus);
    onCommentChange(currentId, modalComment);
    setEditOpen(false);
  };

  const statusBadge = (status: AttendanceStatus) => {
    const base = "border-transparent";
    switch (status) {
      case "present":
        return <Badge className={`${base} bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]`}>Présent</Badge>;
      case "absent":
        return <Badge variant="destructive">Absent</Badge>;
      case "retard":
        return <Badge className={`${base} bg-[hsl(var(--info))] text-[hsl(var(--info-foreground))]`}>Retard</Badge>;
      case "renvoi":
        return <Badge variant="outline" className="text-destructive">Renvoi</Badge>;
      default:
        return <Badge variant="secondary">—</Badge>;
    }
  };

  return (
    <div className="overflow-auto max-h-[60vh]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Prénom</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Date Naissance</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((s) => {
            const value = entries[s.id] || { status: "present" as AttendanceStatus, comment: "" };
            return (
              <TableRow key={s.id}>
                <TableCell className="text-muted-foreground">{s.id}</TableCell>
                <TableCell className="font-medium text-foreground">{s.firstName}</TableCell>
                <TableCell className="font-medium text-foreground">{s.lastName}</TableCell>
                <TableCell>{s.birthDate ? new Date(s.birthDate).toLocaleDateString("fr-FR") : "—"}</TableCell>
                <TableCell>{statusBadge(value.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" disabled={locked} onClick={() => openEdit(s.id)} title="Modifier statut">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openView(s.id)} title="Voir justification">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Edit modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mettre à jour le statut</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Statut</label>
              <Select value={modalStatus} onValueChange={(v) => setModalStatus(v as AttendanceStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Présent</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="retard">Retard</SelectItem>
                  <SelectItem value="renvoi">Renvoi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {modalStatus !== "present" && (
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Justification (optionnel)</label>
                <Textarea value={modalComment} onChange={(e) => setModalComment(e.target.value)} placeholder="Saisir la justification" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
            <Button onClick={saveEdit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View modal */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Justification</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-foreground whitespace-pre-wrap">
            {(current?.comment || "").trim() ? current?.comment : "Aucune justification"}
          </div>
          <DialogFooter>
            <Button onClick={() => setViewOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
