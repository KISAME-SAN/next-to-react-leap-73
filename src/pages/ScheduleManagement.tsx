import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";

interface ScheduleBlock {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacherId: string;
  classId: string;
  color: string;
  createdAt: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  subject: string;
}

interface Class {
  id: string;
  name: string;
}

export default function ScheduleManagement() {
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedView, setSelectedView] = useState<"class" | "teacher">("class");
  const [selectedId, setSelectedId] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);
  const [message, setMessage] = useState("");

  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

  useEffect(() => {
    document.title = "Gestion des Emplois du Temps — École Manager";
    const savedSchedules = JSON.parse(localStorage.getItem("schedules") || "[]");
    const savedTeachers = JSON.parse(localStorage.getItem("teachers") || "[]");
    const savedClasses = JSON.parse(localStorage.getItem("classes") || "[]");

    setScheduleBlocks(savedSchedules);
    setTeachers(savedTeachers);
    setClasses(savedClasses);
  }, []);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 8; hour <= 20; hour++) {
      const h = hour.toString().padStart(2, "0");
      slots.push(`${h}:00`);
    }
    return slots;
  }, []);

  const formTimeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 8; hour <= 20; hour++) {
      const h = hour.toString().padStart(2, "0");
      slots.push(`${h}:00`);
      if (hour < 20) slots.push(`${h}:30`);
    }
    return slots;
  }, []);

  const subjects = useMemo(
    () => [
      "Anglais",
      "Mathématiques", 
      "Physique-Chimie",
      "SVT",
      "Français",
      "Histoire-Géographie",
      "Philosophie",
      "EPS",
      "Économie",
      "Espagnol",
      "Musique",
      "Art",
      "Grec",
      "Portugais",
      "Arabe",
    ],
    []
  );

  const colors = useMemo(
    () => [
      "#3B82F6",
      "#EF4444",
      "#10B981", 
      "#F59E0B",
      "#8B5CF6",
      "#EC4899",
      "#06B6D4",
      "#84CC16",
      "#F97316",
      "#6366F1",
    ],
    []
  );

  const getFilteredSchedule = () => {
    if (!selectedId) return [] as ScheduleBlock[];
    return scheduleBlocks.filter((block) => (selectedView === "class" ? block.classId === selectedId : block.teacherId === selectedId));
  };

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const isTimeConflict = (start1: string, end1: string, start2: string, end2: string) => {
    const start1Min = timeToMinutes(start1);
    const end1Min = timeToMinutes(end1);
    const start2Min = timeToMinutes(start2);
    const end2Min = timeToMinutes(end2);
    return start1Min < end2Min && end1Min > start2Min;
  };

  const getConflicts = (
    day: string,
    startTime: string,
    endTime: string,
    teacherId: string,
    classId: string,
    excludeId?: string
  ) => {
    return scheduleBlocks.filter(
      (block) =>
        block.id !== excludeId &&
        block.day === day &&
        (block.teacherId === teacherId || block.classId === classId) &&
        isTimeConflict(startTime, endTime, block.startTime, block.endTime)
    );
  };

  const handleCreateBlock = (blockData: Omit<ScheduleBlock, "id" | "createdAt">) => {
    const conflicts = getConflicts(blockData.day, blockData.startTime, blockData.endTime, blockData.teacherId, blockData.classId);
    const teacherConflict = conflicts.find((c) => c.teacherId === blockData.teacherId);
    const classConflict = conflicts.find((c) => c.classId === blockData.classId);

    if (teacherConflict) {
      setMessage("Conflit détecté: Le professeur a déjà cours à cette heure!");
      setTimeout(() => setMessage(""), 5000);
      return;
    }
    if (classConflict) {
      setMessage("Conflit détecté: La classe a déjà cours à cette heure!");
      setTimeout(() => setMessage(""), 5000);
      return;
    }

    const newBlock: ScheduleBlock = { id: Date.now().toString(), ...blockData, createdAt: new Date().toISOString() };
    const updatedSchedules = [...scheduleBlocks, newBlock];
    setScheduleBlocks(updatedSchedules);
    localStorage.setItem("schedules", JSON.stringify(updatedSchedules));
    setShowCreateForm(false);
    setMessage("Cours ajouté avec succès!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleEditBlock = (updatedBlock: ScheduleBlock) => {
    const conflicts = getConflicts(
      updatedBlock.day,
      updatedBlock.startTime,
      updatedBlock.endTime,
      updatedBlock.teacherId,
      updatedBlock.classId,
      updatedBlock.id
    );
    const teacherConflict = conflicts.find((c) => c.teacherId === updatedBlock.teacherId);
    const classConflict = conflicts.find((c) => c.classId === updatedBlock.classId);

    if (teacherConflict) {
      setMessage("Conflit détecté: Le professeur a déjà cours à cette heure!");
      setTimeout(() => setMessage(""), 5000);
      return;
    }
    if (classConflict) {
      setMessage("Conflit détecté: La classe a déjà cours à cette heure!");
      setTimeout(() => setMessage(""), 5000);
      return;
    }

    const updatedSchedules = scheduleBlocks.map((block) => (block.id === updatedBlock.id ? updatedBlock : block));
    setScheduleBlocks(updatedSchedules);
    localStorage.setItem("schedules", JSON.stringify(updatedSchedules));
    setEditingBlock(null);
    setMessage("Cours modifié avec succès!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce cours?")) {
      const updatedSchedules = scheduleBlocks.filter((block) => block.id !== blockId);
      setScheduleBlocks(updatedSchedules);
      localStorage.setItem("schedules", JSON.stringify(updatedSchedules));
      setMessage("Cours supprimé avec succès!");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : "Professeur inconnu";
  };

  const getClassName = (classId: string) => {
    const cls = classes.find((c) => c.id === classId);
    return cls ? cls.name : "Classe inconnue";
  };

  const getBlocksForTimeSlot = (day: string, timeSlot: string) => {
    const filteredSchedule = getFilteredSchedule();
    return filteredSchedule.filter(
      (block) => block.day === day && timeToMinutes(block.startTime) <= timeToMinutes(timeSlot) && timeToMinutes(block.endTime) > timeToMinutes(timeSlot)
    );
  };

  const calculateBlockSpan = (block: ScheduleBlock, currentTime: string) => {
    const blockStart = timeToMinutes(block.startTime);
    const blockEnd = timeToMinutes(block.endTime);
    const currentSlot = timeToMinutes(currentTime);
    const slotDuration = 30;
    const blockDuration = blockEnd - blockStart;
    if (blockStart === currentSlot) return Math.ceil(blockDuration / slotDuration);
    return 0;
  };

  const isBlockStart = (block: ScheduleBlock, timeSlot: string) => timeToMinutes(block.startTime) === timeToMinutes(timeSlot);

  return (
    <div className="min-h-[60vh] p-2 md:p-4 animate-fade-in">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground animate-slide-up">Gestion des Emplois du Temps</h1>
      </header>

      {message && (
        <div
          className={`mb-4 p-4 rounded-md border ${
            message.includes("Conflit")
              ? "bg-destructive/10 text-destructive border-destructive/30"
              : "bg-green-50 text-green-700 border-green-200"
          }`}
        >
          {message}
        </div>
      )}

      <section className="bg-card rounded-lg shadow-sm border border-border mb-6">
        <div className="p-4 border-b border-border">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-muted-foreground">Affichage</label>
              <select
                value={selectedView}
                onChange={(e) => {
                  setSelectedView(e.target.value as "class" | "teacher");
                  setSelectedId("");
                }}
                className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
              >
                <option value="class">Par Classe</option>
                <option value="teacher">Par Professeur</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-muted-foreground">{selectedView === "class" ? "Classe" : "Professeur"}</label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
              >
                <option value="">Sélectionner…</option>
                {selectedView === "class"
                  ? classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))
                  : teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName}
                      </option>
                    ))}
              </select>
            </div>

            <div className="ml-auto">
              <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Ajouter un Cours
              </Button>
            </div>
          </div>
        </div>
      </section>

      {selectedId && (
        <section className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              Emploi du temps — {selectedView === "class" ? getClassName(selectedId) : getTeacherName(selectedId)}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <div className="w-max">
              <div className="grid grid-cols-[120px_repeat(6,minmax(180px,1fr))] border-b border-border w-max">
                <div className="p-3 bg-muted/40 font-medium text-muted-foreground border-r border-border flex items-center">
                  Horaires
                </div>
                {days.map((day) => (
                  <div key={day} className="p-3 bg-muted/40 font-medium text-muted-foreground text-center border-r border-border last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-[120px_repeat(6,minmax(180px,1fr))] w-max">
                {/* Axe des heures */}
                <div className="relative border-r border-border">
                  {timeSlots.map((time) => (
                    <div key={time} className="h-[60px] flex items-center px-3 text-muted-foreground border-b border-border/60 last:border-0">
                      <Clock className="w-4 h-4 mr-2" />
                      {time}
                    </div>
                  ))}
                </div>

                {/* Colonnes par jour avec positionnement absolu des blocs */}
                {days.map((day) => {
                  const slotHeight = 60; // hauteur d'une heure
                  const startMinutes = timeToMinutes(timeSlots[0]);
                  const pxPerMinute = slotHeight / 60; // 1 heure = 60 minutes
                  const columnHeight = timeSlots.length * slotHeight;
                  const dayBlocks = getFilteredSchedule().filter((b) => b.day === day);

                  return (
                    <div
                      key={day}
                      className="relative border-r border-border last:border-r-0"
                      style={{ height: `${columnHeight}px` }}
                    >
                      {/* lignes de fond toutes les heures */}
                      {timeSlots.map((_, idx) => (
                        <div
                          key={idx}
                          className="absolute left-0 right-0 border-b border-border/60"
                          style={{ top: `${idx * slotHeight}px` }}
                        />
                      ))}

                      {/* blocs de cours positionnés en absolu */}
                      {dayBlocks.map((block) => {
                        const top = (timeToMinutes(block.startTime) - startMinutes) * pxPerMinute + 2;
                        const height = (timeToMinutes(block.endTime) - timeToMinutes(block.startTime)) * pxPerMinute - 4;
                        return (
                          <div
                            key={block.id}
                            className="absolute left-1 right-1 rounded-md p-2 text-white text-xs group cursor-pointer shadow-sm flex flex-col items-center justify-center text-center"
                            style={{ top: `${top}px`, height: `${Math.max(height, 20)}px`, backgroundColor: block.color, zIndex: 10 }}
                          >
                            <div className="font-semibold leading-tight">{block.subject}</div>
                            <div className="opacity-90 mt-1">
                              {selectedView === "class" ? getTeacherName(block.teacherId) : getClassName(block.classId)}
                            </div>
                            <div className="opacity-80">{block.startTime} - {block.endTime}</div>
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                              <Button size="icon" variant="secondary" className="h-6 w-6" onClick={() => setEditingBlock(block)} aria-label="Modifier">
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button size="icon" variant="destructive" className="h-6 w-6" onClick={() => handleDeleteBlock(block.id)} aria-label="Supprimer">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {(showCreateForm || editingBlock) && (
        <ScheduleBlockForm
          initialData={editingBlock}
          teachers={teachers}
          classes={classes}
          subjects={subjects}
          timeSlots={formTimeSlots}
          days={days}
          colors={colors}
          onSave={editingBlock ? handleEditBlock : handleCreateBlock}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingBlock(null);
          }}
        />
      )}
    </div>
  );
}

interface ScheduleBlockFormProps {
  initialData?: ScheduleBlock | null;
  teachers: Teacher[];
  classes: Class[];
  subjects: string[];
  timeSlots: string[];
  days: string[];
  colors: string[];
  onSave: (block: any) => void;
  onCancel: () => void;
}

function ScheduleBlockForm({ initialData, teachers, classes, subjects, timeSlots, days, colors, onSave, onCancel }: ScheduleBlockFormProps) {
  const [formData, setFormData] = useState({
    day: initialData?.day || "",
    startTime: initialData?.startTime || "",
    endTime: initialData?.endTime || "",
    subject: initialData?.subject || "",
    teacherId: initialData?.teacherId || "",
    classId: initialData?.classId || "",
    color: initialData?.color || colors[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.day || !formData.startTime || !formData.endTime || !formData.subject || !formData.teacherId || !formData.classId) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };
    if (timeToMinutes(formData.endTime) <= timeToMinutes(formData.startTime)) {
      alert("L'heure de fin doit être après l'heure de début.");
      return;
    }
    if (initialData) onSave({ ...initialData, ...formData });
    else onSave(formData);
  };

  const getAvailableEndTimes = () => {
    if (!formData.startTime) return [] as string[];
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };
    const startMinutes = timeToMinutes(formData.startTime);
    return timeSlots.filter((time) => timeToMinutes(time) > startMinutes);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">{initialData ? "Modifier le Cours" : "Ajouter un Nouveau Cours"}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Jour *</label>
              <select
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                required
              >
                <option value="">Sélectionner un jour</option>
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Matière *</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                required
              >
                <option value="">Sélectionner une matière</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Heure de début *</label>
              <select
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value, endTime: "" })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                required
              >
                <option value="">Sélectionner l'heure</option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Heure de fin *</label>
              <select
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                required
                disabled={!formData.startTime}
              >
                <option value="">Sélectionner l'heure</option>
                {getAvailableEndTimes().map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Professeur *</label>
              <select
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                required
              >
                <option value="">Sélectionner un professeur</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.firstName} {teacher.lastName} ({teacher.subject})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Classe *</label>
              <select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                required
              >
                <option value="">Sélectionner une classe</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Couleur du bloc</label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-7 h-7 rounded-md border ${formData.color === color ? "border-ring ring-2 ring-ring" : "border-border"}`}
                  style={{ backgroundColor: color }}
                  aria-label={`Choisir la couleur ${color}`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit">{initialData ? "Modifier" : "Ajouter"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
