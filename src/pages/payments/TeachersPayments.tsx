import SEO from "@/components/SEO";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function TeachersPayments() {
  const canonical = typeof window !== "undefined" ? window.location.origin + "/payments/teachers" : undefined;
  return (
    <main className="animate-fade-in">
      <SEO title="Paiements — Professeurs" description="Section à développer ultérieurement." canonical={canonical} jsonLd={{"@context":"https://schema.org","@type":"WebPage",name:"Paiements professeurs",url:canonical}} />
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Paiements — Professeurs</h1>
      </header>
      <Card className="border">
        <CardHeader><CardTitle>À venir</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cette section sera développée ultérieurement (ou version allégée).</p>
        </CardContent>
      </Card>
    </main>
  );
}
