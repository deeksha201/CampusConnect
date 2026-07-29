import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, itemFormSchema, type ItemFormValues } from "@/lib/campus";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  type: z.enum(["lost", "found"]).optional(),
});

export const Route = createFileRoute("/report")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Report an Item — Campus Connect" },
      {
        name: "description",
        content: "Report a lost or found item on campus. Share a photo, location, and contact details.",
      },
      { property: "og:title", content: "Report an Item — Campus Connect" },
      { property: "og:description", content: "Post a lost or found item to the campus feed." },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const search = useSearch({ from: "/report" });

  const [values, setValues] = useState<ItemFormValues>({
    type: search.type ?? "lost",
    title: "",
    description: "",
    category: "Electronics",
    location: "",
    image_url: "",
    contact_info: "",
    occurred_at: new Date().toISOString().slice(0, 16),
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ItemFormValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth", search: { redirect: "/report" }, replace: true });
    }
  }, [authLoading, user, navigate]);

  function update<K extends keyof ItemFormValues>(key: K, value: ItemFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = itemFormSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ItemFormValues;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setErrors({});
    if (!user) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("items")
        .insert({
          user_id: user.id,
          type: parsed.data.type,
          title: parsed.data.title,
          description: parsed.data.description,
          category: parsed.data.category,
          location: parsed.data.location,
          image_url: parsed.data.image_url || null,
          contact_info: parsed.data.contact_info,
          occurred_at: new Date(parsed.data.occurred_at).toISOString(),
        })
        .select("id")
        .single();
      if (error) throw error;
      toast.success("Report posted.");
      qc.invalidateQueries({ queryKey: ["items"] });
      navigate({ to: "/items/$id", params: { id: data.id } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to post report";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-display font-bold mb-2">Report an item</h1>
        <p className="text-muted-foreground mb-6">
          Fill out the details below. The more specific, the higher the chance of a match.
        </p>

        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-surface border border-border rounded-xl mb-6">
          {(["lost", "found"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => update("type", t)}
              className={cn(
                "py-3 rounded-lg text-sm font-semibold capitalize transition-colors",
                values.type === t
                  ? t === "lost"
                    ? "bg-danger text-danger-foreground shadow"
                    : "bg-secondary text-secondary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              I {t === "lost" ? "lost" : "found"} something
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6 space-y-5">
          <Field label="Item title" error={errors.title} htmlFor="title">
            <Input
              id="title"
              value={values.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g. Blue Hydroflask 32oz"
              maxLength={120}
            />
          </Field>

          <Field label="Description" error={errors.description} htmlFor="description">
            <Textarea
              id="description"
              value={values.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Distinctive features, stickers, marks, contents..."
              rows={4}
              maxLength={2000}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Category" error={errors.category} htmlFor="category">
              <select
                id="category"
                value={values.category}
                onChange={(e) => update("category", e.target.value as ItemFormValues["category"])}
                className="w-full h-10 px-3 rounded-md bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>

            <Field label="Location on campus" error={errors.location} htmlFor="location">
              <Input
                id="location"
                value={values.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder="e.g. Library, Floor 3"
                maxLength={120}
              />
            </Field>
          </div>

          <Field
            label="When did it happen?"
            error={errors.occurred_at}
            htmlFor="occurred_at"
          >
            <Input
              id="occurred_at"
              type="datetime-local"
              value={values.occurred_at}
              onChange={(e) => update("occurred_at", e.target.value)}
            />
          </Field>

          <Field label="Image URL (optional)" error={errors.image_url} htmlFor="image_url">
            <Input
              id="image_url"
              type="url"
              value={values.image_url}
              onChange={(e) => update("image_url", e.target.value)}
              placeholder="https://..."
              maxLength={500}
            />
          </Field>

          <Field
            label="Contact info"
            error={errors.contact_info}
            htmlFor="contact_info"
            hint="How should people reach you? Email, phone, or WhatsApp."
          >
            <Input
              id="contact_info"
              value={values.contact_info}
              onChange={(e) => update("contact_info", e.target.value)}
              placeholder="you@university.edu or +91 98765 43210"
              maxLength={200}
            />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate({ to: "/" })}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="shadow-glow-primary">
              {submitting ? "Posting..." : "Post report"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}
