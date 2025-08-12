import { Button } from "@/components/ui/button";
import { Search, Lock, Unlock, Download } from "lucide-react";
import type { Class, ScheduleBlock, AttendanceStatus } from "../types";

interface Props {
  classes: Class[];
  selectedClassId: string;
  onChangeClass: (id: string) => void;
  date: string;
  onChangeDate: (d: string) => void;
  dayBlocks: ScheduleBlock[];
  selectedBlockId: string;
  onChangeBlock: (id: string) => void;
  onSetAll: (status: AttendanceStatus) => void;
  searchTerm: string;
  onChangeSearch: (q: string) => void;
  locked: boolean;
  onToggleLock: () => void;
  onExportCSV: () => void;
}

export default function StudentsAttendanceToolbar({
  classes,
  selectedClassId,
  onChangeClass,
  date,
  onChangeDate,
  dayBlocks,
  selectedBlockId,
  onChangeBlock,
  onSetAll,
  searchTerm,
  onChangeSearch,
  locked,
  onToggleLock,
  onExportCSV,
}: Props) {
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-5 gap-4">
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">Classe</label>
        <select
          value={selectedClassId}
          onChange={(e) => onChangeClass(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
        >
          <option value="">Sélectionner…</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => onChangeDate(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-muted-foreground mb-2">Séance (emploi du temps)</label>
        <select
          value={selectedBlockId}
          onChange={(e) => onChangeBlock(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
          disabled={!selectedClassId}
        >
          <option value="">Sélectionner…</option>
          {dayBlocks.length === 0 && <option value="" disabled>Aucune séance prévue ce jour</option>}
          {dayBlocks.map((b) => (
            <option key={b.id} value={b.id}>
              {b.subject} — {b.startTime}–{b.endTime}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">Recherche</label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onChangeSearch(e.target.value)}
              placeholder="Rechercher un élève…"
              className="w-full pl-8 pr-3 py-2 border border-input rounded-md bg-background"
            />
          </div>
          <Button variant="outline" onClick={onExportCSV} title="Exporter CSV">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={onToggleLock} title={locked ? "Déverrouiller" : "Verrouiller"}>
            {locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {selectedClassId && (
        <div className="md:col-span-5 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => onSetAll("present")}>Tous Présents</Button>
          <Button variant="outline" onClick={() => onSetAll("absent")}>Tous Absents</Button>
          <Button variant="outline" onClick={() => onSetAll("retard")}>Tous Retards</Button>
          <Button variant="outline" onClick={() => onSetAll("renvoi")}>Tous Renvois</Button>
        </div>
      )}
    </div>
  );
}
