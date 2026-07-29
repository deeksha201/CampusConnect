import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { relativeTime } from "@/lib/campus";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Clock, Tag, CheckCircle2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/items/$id")({
  component: ItemDetail,
});

function ItemDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: item, isLoading, error } = useQuery({
    queryKey: ["item", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const markReturned = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("items")
        .update({ status: "returned" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Marked as returned. Nice work!");
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["item", id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update"),
  });

  const deleteItem = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report deleted");
      qc.invalidateQueries({ queryKey: ["items"] });
      navigate({ to: "/" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete"),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="max-w-4xl mx-auto p-8 text-muted-foreground">Loading...</div>
      </div>
    );
  }
  if (error || !item) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="max-w-4xl mx-auto p-8">
          <p className="text-muted-foreground">This item couldn't be loaded.</p>
          <Button asChild variant="outline" className="mt-4"><Link to="/">Back to feed</Link></Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === item.user_id;
  const isLost = item.type === "lost";
  const returned = item.status === "returned";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="size-4" /> Back to feed
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-surface border border-border rounded-2xl aspect-[4/3] overflow-hidden grid place-items-center">
            {item.image_url ? (
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-muted-foreground text-sm">No photo provided</span>
            )}
          </div>

          <div>
            <div className="flex gap-2 mb-3">
              <span
                className={cn(
                  "text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-tighter",
                  isLost ? "bg-danger text-danger-foreground" : "bg-secondary text-secondary-foreground",
                )}
              >
                {item.type}
              </span>
              {returned && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-tighter bg-foreground text-background">
                  Returned
                </span>
              )}
              <span className="text-[11px] font-medium px-2.5 py-1 rounded bg-surface border border-border text-muted-foreground">
                {item.category}
              </span>
            </div>

            <h1 className="text-3xl font-display font-bold mb-3 leading-tight">{item.title}</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-sm">
              <Meta icon={<MapPin className="size-4" />} label="Location" value={item.location} />
              <Meta icon={<Tag className="size-4" />} label="Category" value={item.category} />
              <Meta
                icon={<Clock className="size-4" />}
                label={isLost ? "Lost on" : "Found on"}
                value={new Date(item.occurred_at).toLocaleString()}
              />
              <Meta icon={<Clock className="size-4" />} label="Posted" value={relativeTime(item.created_at)} />
            </div>

            <div className="mb-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Description
              </h2>
              <p className="text-foreground whitespace-pre-wrap">{item.description}</p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-4 mb-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Contact
              </h2>
              {user ? (
                <p className="text-foreground break-words">{item.contact_info}</p>
              ) : (
                <div>
                  <p className="text-muted-foreground text-sm mb-3">
                    Sign in to view the poster's contact details.
                  </p>
                  <Button asChild size="sm"><Link to="/auth" search={{ redirect: `/items/${id}` }}>Sign in to view</Link></Button>
                </div>
              )}
            </div>

            {isOwner && !returned && (
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => markReturned.mutate()}
                  disabled={markReturned.isPending}
                  className="shadow-glow-secondary"
                  style={{ background: "var(--color-secondary)", color: "var(--color-secondary-foreground)" }}
                >
                  <CheckCircle2 className="size-4" /> Mark as returned
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("Delete this report? This can't be undone.")) deleteItem.mutate();
                  }}
                  disabled={deleteItem.isPending}
                >
                  <Trash2 className="size-4" /> Delete
                </Button>
              </div>
            )}
            {isOwner && returned && (
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm("Delete this report? This can't be undone.")) deleteItem.mutate();
                }}
              >
                <Trash2 className="size-4" /> Delete report
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
        {icon} {label}
      </div>
      <div className="text-foreground text-sm break-words">{value}</div>
    </div>
  );
}
