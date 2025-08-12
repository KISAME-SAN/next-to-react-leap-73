import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Users, UserCheck } from "lucide-react";

export default function Attendance() {
  const canonical = typeof window !== "undefined" ? window.location.href : undefined;
  return (
    <main className="min-h-[60vh] p-2 md:p-4 animate-fade-in">
      <SEO
        title="Gestion des Présences — École Manager"
        description="Accédez à la présence des élèves et des professeurs. Enregistrement rapide: présent, absent, retard, renvoi."
        canonical={canonical}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Gestion des Présences',
          description: 'Suivi des présences des élèves et professeurs',
        }}
      />
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Gestion des Présences</h1>
        <p className="text-muted-foreground mt-1">Choisissez une section pour enregistrer les présences.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <article className="group border border-border rounded-lg bg-card p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-md bg-muted p-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Présence des Élèves</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Par classe, par séance. Présent, absent, retard, renvoi.</p>
          <Link to="/attendance/students" className="inline-flex px-4 py-2 rounded-md border border-input bg-background hover:bg-muted/50 transition-colors">
            Ouvrir
          </Link>
        </article>

        <article className="group border border-border rounded-lg bg-card p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-md bg-muted p-2">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Présence des Professeurs</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Suivi des présences par professeur et par séance.</p>
          <Link to="/attendance/teachers" className="inline-flex px-4 py-2 rounded-md border border-input bg-background hover:bg-muted/50 transition-colors">
            Ouvrir
          </Link>
        </article>
      </section>
    </main>
  );
}
