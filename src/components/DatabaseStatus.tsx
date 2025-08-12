import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Download, Upload } from "lucide-react";
import { db } from "@/lib/databaseService";
import DatabaseMigrationDialog from "./DatabaseMigrationDialog";

export default function DatabaseStatus() {
  const [isHealthy, setIsHealthy] = useState(false);
  const [showMigration, setShowMigration] = useState(false);
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    years: 0
  });

  useEffect(() => {
    checkDatabaseHealth();
  }, []);

  const checkDatabaseHealth = () => {
    try {
      const healthy = db.isHealthy();
      setIsHealthy(healthy);
      
      if (healthy) {
        // Get basic stats
        const students = db.students.getAllStudents();
        const teachers = db.teachers.getAllTeachers();
        const years = db.academicYears.getAllAcademicYears();
        const currentYear = db.academicYears.getCurrentAcademicYear();
        const classes = currentYear ? db.classes.getClassesByYear(currentYear.id) : [];
        
        setStats({
          students: students.length,
          teachers: teachers.length,
          classes: classes.length,
          years: years.length
        });
      }
    } catch (error) {
      console.error('Database health check failed:', error);
      setIsHealthy(false);
    }
  };

  const exportData = () => {
    try {
      const data = db.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `school-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleMigrationComplete = () => {
    checkDatabaseHealth();
    // Refresh the page to use new database
    window.location.reload();
  };

  return (
    <>
      <Card className="border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Base de données</span>
                  <Badge variant={isHealthy ? "secondary" : "destructive"}>
                    {isHealthy ? "SQLite" : "localStorage"}
                  </Badge>
                </div>
                {isHealthy && (
                  <div className="text-xs text-muted-foreground">
                    {stats.students} élèves • {stats.teachers} profs • {stats.classes} classes • {stats.years} années
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isHealthy ? (
                <Button variant="outline" size="sm" onClick={exportData}>
                  <Download className="w-4 h-4 mr-1" />
                  Exporter
                </Button>
              ) : (
                <Button size="sm" onClick={() => setShowMigration(true)}>
                  <Upload className="w-4 h-4 mr-1" />
                  Migrer vers SQLite
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <DatabaseMigrationDialog
        open={showMigration}
        onOpenChange={setShowMigration}
        onComplete={handleMigrationComplete}
      />
    </>
  );
}