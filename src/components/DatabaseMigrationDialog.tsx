import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Database } from "lucide-react";
import { db } from "@/lib/databaseService";

interface MigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export default function DatabaseMigrationDialog({ open, onOpenChange, onComplete }: MigrationDialogProps) {
  const [step, setStep] = useState<'confirm' | 'migrating' | 'success' | 'error'>('confirm');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>('');

  const startMigration = async () => {
    setStep('migrating');
    setProgress(0);

    try {
      // Create backup
      setProgress(20);
      const backup = db.migration.backupLocalStorageData();
      
      // Save backup to file (optional)
      const blob = new Blob([backup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `school-data-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setProgress(40);

      // Run migration
      await db.migration.migrateFromLocalStorage();
      setProgress(80);

      // Clear localStorage (keep essential keys)
      db.migration.clearLocalStorageData();
      setProgress(100);

      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed');
      setStep('error');
    }
  };

  const handleComplete = () => {
    onComplete();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Migration vers SQLite
          </DialogTitle>
          <DialogDescription>
            Migration des données localStorage vers une base de données SQLite locale
          </DialogDescription>
        </DialogHeader>

        {step === 'confirm' && (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Cette opération va migrer toutes vos données vers une base de données SQLite locale. 
                Un fichier de sauvegarde sera automatiquement téléchargé.
              </AlertDescription>
            </Alert>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Toutes les données seront préservées</p>
              <p>• Un fichier school.db sera créé</p>
              <p>• Sauvegarde automatique avant migration</p>
              <p>• Fonctionnement hors ligne garanti</p>
            </div>
          </div>
        )}

        {step === 'migrating' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Migration en cours...</p>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-muted-foreground mt-1">{progress}%</p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <p className="font-medium text-green-700">Migration réussie !</p>
              <p className="text-sm text-muted-foreground mt-1">
                Vos données sont maintenant stockées dans une base SQLite locale.
              </p>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Erreur lors de la migration: {error}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
          {step === 'confirm' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={startMigration}>
                Commencer la migration
              </Button>
            </>
          )}
          
          {step === 'migrating' && (
            <Button disabled>
              Migration en cours...
            </Button>
          )}
          
          {step === 'success' && (
            <Button onClick={handleComplete}>
              Continuer
            </Button>
          )}
          
          {step === 'error' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fermer
              </Button>
              <Button onClick={startMigration}>
                Réessayer
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}