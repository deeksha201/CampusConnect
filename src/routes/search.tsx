import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { ItemCard, type ItemCardData } from "@/components/item-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/campus";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search Items — Campus Connect" },
      {
        name: "description",
        content:
          "Search all campus lost and found reports by keyword, category, type, and status.",
      },
      { property: "og:title", content: "Search Items — Campus Connect" },
      {
        property: "og:description",
        content: "Filter lost and found items by category, type, and status.",
      },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | "lost" | "found">("all");
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<"all" | "active" | "returned">("active");

  const { data = [], isLoading } = useQuery({
    queryKey: ["items", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("id, type, title, description, category, location, image_url, status, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as ItemCardData[];
    },
  });

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    return data.filter((i) => {
      if (type !== "all" && i.type !== type) return false;
      if (status !== "all" && i.status !== status) return false;
      if (category !== "all" && i.category !== category) return false;
      if (!query) return true;
      return (
        i.title.toLowerCase().includes(query) ||
        i.description.toLowerCase().includes(query) ||
        i.location.toLowerCase().includes(query)
      );
    });
  }, [data, q, type, category, status]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-display font-bold mb-2">Search &amp; Filter</h1>
        <p className="text-muted-foreground mb-8">Find lost belongings or discovered items across campus.</p>

        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-6 mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none" />
            <Input
              aria-label="Search text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Keywords, brand, color, description..."
              className="h-12 pl-12 bg-background border-border text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FilterGroup label="Type">
              {(["all", "lost", "found"] as const).map((t) => (
                <FilterChip key={t} active={type === t} onClick={() => setType(t)}>
                  {t}
                </FilterChip>
              ))}
            </FilterGroup>
            <FilterGroup label="Status">
              {(["all", "active", "returned"] as const).map((s) => (
                <FilterChip key={s} active={status === s} onClick={() => setStatus(s)}>
                  {s}
                </FilterChip>
              ))}
            </FilterGroup>
            <FilterGroup label="Category">
              <select
                aria-label="Category filter"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FilterGroup>
          </div>
        </div>

        <div className="text-sm text-muted-foreground mb-6">
          <span className="text-foreground font-medium">{results.length}</span> results
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-surface animate-pulse" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl p-16 text-center">
            <p className="text-muted-foreground mb-4">No results match your filters.</p>
            <Button asChild variant="outline">
              <Link to="/report">Post a new report</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {results.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-semibold">{label}</div>
      <div className="flex gap-2 flex-wrap">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors",
        active
          ? "bg-primary/10 text-primary border-primary/30"
          : "bg-background text-muted-foreground border-border hover:border-border/80",
      )}
    >
      {children}
    </button>
  );
}
