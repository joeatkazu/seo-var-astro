import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Add meg a neved").max(100),
  email: z.string().trim().email("Ervenytelen email cim").max(255),
  website: z.string().trim().max(255).optional(),
  message: z.string().trim().min(1, "Ird le az uzeneted").max(2000),
});

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    website: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        "https://api.hsforms.com/submissions/v3/integration/submit/147792287/048412e7-145f-4091-a75d-f6cee165c8ab",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: [
              { name: "firstname", value: formData.name },
              { name: "email", value: formData.email },
              { name: "website", value: formData.website },
              { name: "message", value: formData.message },
            ],
          }),
        }
      );
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
      toast({
        title: "Uzenet elkuldve!",
        description: "Hamarosan felvesszuk veled a kapcsolatot.",
      });
    } catch {
      toast({
        title: "Hiba tortent",
        description: "Kerlek probald ujra kesobb.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section id="kapcsolat" className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-[hsl(var(--primary))]" />
            <h2 className="mb-2 text-2xl font-bold">Koszonjuk!</h2>
            <p className="text-[hsl(var(--muted-foreground))]">
              Uzeneted megkaptuk, hamarosan jelentkezunk.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="kapcsolat" className="py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
          Kérdezzen közvetlenül <span className="text-[hsl(var(--primary))]">tőlünk!</span>
          </h2>
          <p className="text-slate-600">
            Ird meg, miben segithetunk, es 24 oran belul valaszolunk. Írja meg nekünk, miben segíthetünk, és 24 órán belül válaszolunk.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-xl space-y-6 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm sm:p-10"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Név *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="bg-[hsl(var(--background))]"
            />
            {errors.name && (
              <p className="text-sm text-[hsl(var(--destructive))]">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="bg-[hsl(var(--background))]"
            />
            {errors.email && (
              <p className="text-sm text-[hsl(var(--destructive))]">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Weboldal</Label>
            <Input
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="bg-[hsl(var(--background))]"
              placeholder="https://"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Üzenet *</Label>
            <Textarea
              id="message"
              name="message"
              rows={5}
              value={formData.message}
              onChange={handleChange}
              className="bg-[hsl(var(--background))]"
            />
            {errors.message && (
              <p className="text-sm text-[hsl(var(--destructive))]">{errors.message}</p>
            )}
          </div>

          <Button type="submit" variant="hero" size="lg" className="w-full gap-2 text-base" disabled={submitting}>
            {submitting ? "Kuldes..." : "Üzenet küldése"}
            <Send size={18} />
          </Button>
        </form>
      </div>
    </section>
  );
}
