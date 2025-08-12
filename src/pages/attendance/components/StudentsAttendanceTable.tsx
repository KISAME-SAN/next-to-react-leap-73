import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AttendanceStatus, Student } from "../types";

export type EntryValue = { status: AttendanceStatus; comment: string };

interface Props {
  students: Student[];
  entries: Record<string, EntryValue>;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  onCommentChange: (studentId: string, comment: string) => void;
  locked?: boolean;
}

export default function StudentsAttendanceTable({ students, entries, onStatusChange, onCommentChange, locked }: Props) {
  const onRowKey = (studentId: string, e: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (locked) return;
    const key = e.key.toLowerCase();
    const map: Record<string, AttendanceStatus> = { p: "present", a: "absent", r: "retard", v: "renvoi" };
    if (map[key]) {
      e.preventDefault();
      onStatusChange(studentId, map[key]);
    }
  };

  return (
    <div className="overflow-auto max-h-[60vh]">
      <div className="px-4 pb-2 text-xs text-muted-foreground">Astuce: sélectionnez une ligne puis tapez P/A/R/V pour changer le statut.</div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Élève</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Commentaire</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((s) => {
            const value = entries[s.id] || { status: "present" as AttendanceStatus, comment: "" };
            return (
              <TableRow key={s.id} tabIndex={0} onKeyDown={(e) => onRowKey(s.id, e)}>
                <TableCell className="font-medium text-foreground">{s.firstName} {s.lastName}</TableCell>
                <TableCell>
                  <select
                    value={value.status}
                    onChange={(e) => onStatusChange(s.id, e.target.value as AttendanceStatus)}
                    disabled={locked}
                    className="px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="present">Présent</option>
                    <option value="absent">Absent</option>
                    <option value="retard">Retard</option>
                    <option value="renvoi">Renvoi</option>
                  </select>
                </TableCell>
                <TableCell>
                  <input
                    type="text"
                    value={value.comment}
                    onChange={(e) => onCommentChange(s.id, e.target.value)}
                    placeholder="Commentaire (optionnel)"
                    disabled={locked}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
