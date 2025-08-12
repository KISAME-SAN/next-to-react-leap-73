import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import SEO from "@/components/SEO";
import { Settings, ListChecks, BadgePlus, Bus } from "lucide-react";

export default function StudentsHome() {
  const canonical = typeof window !== "undefined" ? window.location.origin + "/payments/students" : undefined;
  return (
    <main className="animate-fade-in">
      <SEO
        title="Paiements Élèves — Hub"
        description="Accédez à la configuration, au suivi, aux frais annexes et aux services."
        canonical={canonical}
        jsonLd={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "Paiements élèves", url: canonical }}
      />

      <header className="mb-6">
        <h1 className="text-2xl font-bold">Paiements — Élèves</h1>
        <p className="text-muted-foreground mt-1">Choisissez une action.</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/payments/students/configuration" className="block">
          <Card className="h-full border hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" /> Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Définir montants d'inscription et mensualités par classe.</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/payments/students/tracking" className="block">
          <Card className="h-full border hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ListChecks className="w-5 h-5" /> Suivi des paiements</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Filtres, tri, pagination, statut automatique.</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/payments/students/fees" className="block">
          <Card className="h-full border hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BadgePlus className="w-5 h-5" /> Frais annexes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Créer, gérer et lister les frais ponctuels.</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/payments/students/services" className="block">
          <Card className="h-full border hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bus className="w-5 h-5" /> Services</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Créer, gérer et lister les services mensuels.</p>
            </CardContent>
          </Card>
        </Link>
      </section>
    </main>
  );
}
