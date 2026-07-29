import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { ItemCard, type ItemCardData } from "@/components/item-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/my-reports")({
  head: () => ({
    meta: [
      { title: "My Reports — Campus Connect" },
      { name: "description", content: "Your posted lost and found items on Campus Connect." },
      { property: "og:title", content: "My Reports — Campus Connect" },
      { property: "og:description", content: "Track and manage your posted reports." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyReports,
});

function MyReports() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth", search: { redirect: "/my-reports" }, replace: true });
    }
  }, [loading, user, navigate]);

  const { data = [], isLoading } = useQuery({
    queryKey: ["items", "mine", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("id, type, title, description, category, location, image_url, status, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ItemCardData[];
    },
  });

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="max-w-4xl mx-auto p-8 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">My Reports</h1>
            <p className="text-muted-foreground mt-1">Everything you've posted, in one place.</p>
          </div>
          <Button asChild className="shadow-glow-primary">
            <Link to="/report">+ New report</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-surface animate-pulse" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl p-16 text-center">
            <h3 className="font-display font-semibold text-lg mb-2">No reports yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Report your first lost or found item to get started.
            </p>
            <Button asChild><Link to="/report">Report an item</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
