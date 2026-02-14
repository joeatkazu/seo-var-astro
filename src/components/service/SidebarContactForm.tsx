import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1, "Add meg a neved").max(100),
  email: z.string().trim().email("Érvénytelen email cím").max(255),
  website: z.string().trim().max(255).optional(),
  message: z.string().trim().min(1, "Írd le az üzeneted").max(2000),
});

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-sm";
const labelClass =
  "block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2";

export default function SidebarContactForm() {
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
    const result = schema.safeParse(formData);
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
        title: "Üzenet elküldve!",
        description: "Hamarosan felvesszük Önnel a kapcsolatot.",
      });
    } catch {
      toast({
        title: "Hiba történt",
        description: "Kérjük próbálja újra később.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-6">
        <CheckCircle className="mx-auto mb-3 h-10 w-10 text-blue-600" />
        <h4 className="text-lg font-bold text-slate-900 mb-1">Köszönjük!</h4>
        <p className="text-sm text-slate-500">
          Üzenetét megkaptuk, hamarosan jelentkezünk.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Név *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={inputClass}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-500">{errors.name}</p>
        )}
      </div>
      <div>
        <label className={labelClass}>Email *</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={inputClass}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-500">{errors.email}</p>
        )}
      </div>
      <div>
        <label className={labelClass}>Weboldal</label>
        <input
          type="url"
          name="website"
          value={formData.website}
          onChange={handleChange}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Üzenet *</label>
        <textarea
          name="message"
          rows={4}
          value={formData.message}
          onChange={handleChange}
          className={inputClass}
        />
        {errors.message && (
          <p className="mt-1 text-xs text-red-500">{errors.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {submitting ? "Küldés..." : "Üzenet küldése"}
        <Send size={16} />
      </button>
    </form>
  );
}
