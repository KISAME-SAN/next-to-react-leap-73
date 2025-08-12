import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { School, Users, UserCog } from "lucide-react";
import SEO from "@/components/SEO";

export default function Payments() {
  const canonical = typeof window !== "undefined" ? window.location.origin + "/payments" : undefined;
  return (
    <main className="animate-fade-in">
      <SEO
        title="Gestion des Paiements — Hub"
        description="Choisissez la gestion des paiements: élèves ou professeurs."
        canonical={canonical}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Hub Paiements",
          description: "Accès aux paiements élèves et professeurs",
          url: canonical,
        }}
      />

      <header className="mb-6 animate-slide-up">
        <h1 className="text-3xl font-bold">Gestion des Paiements</h1>
        <p className="text-muted-foreground mt-1">Sélectionnez un bloc pour continuer.</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/payments/students" className="block group">
          <Card className="h-full transition hover:shadow-md border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><School className="w-5 h-5" /> Paiements des élèves</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Configurer les montants, suivre les paiements, gérer frais annexes et services.</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/payments/teachers" className="block group">
          <Card className="h-full transition hover:shadow-md border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserCog className="w-5 h-5" /> Paiements des professeurs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Développement futur (ou version allégée).</p>
            </CardContent>
          </Card>
        </Link>
      </section>
    </main>
  );
}
