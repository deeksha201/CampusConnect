import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { ItemCard, type ItemCardData } from "@/components/item-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Campus Connect — Lost & Found Feed" },
      {
        name: "description",
        content:
          "Browse the latest lost and found reports across campus. Report, search, and recover items in one place.",
      },
      { property: "og:title", content: "Campus Connect — Lost & Found Feed" },
      {
        property: "og:description",
        content: "Browse the latest lost and found reports across campus. Report, search, and recover items in one place.",
      },
    ],
  }),
  component: HomePage,
});

type FilterType = "all" | "lost" | "found";

function HomePage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<FilterType>("all");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items", "feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("id, type, title, description, category, location, image_url, status, created_at")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data as ItemCardData[];
    },
  });

  const stats = useMemo(() => {
    const active = items.filter((i) => i.status === "active").length;
    const returned = items.filter((i) => i.status === "returned").length;
    const rate = items.length ? Math.round((returned / items.length) * 100) : 0;
    return { active, returned, rate };
  }, [items]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((i) => {
      if (type !== "all" && i.type !== type) return false;
      if (!query) return true;
      return (
        i.title.toLowerCase().includes(query) ||
        i.description.toLowerCase().includes(query) ||
        i.location.toLowerCase().includes(query) ||
        i.category.toLowerCase().includes(query)
      );
    });
  }, [items, type, q]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Hero */}
        <section className="mb-14">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4 leading-tight">
              Lost it? Found it?
              <br />
              <span className="text-primary">Recover it here.</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg mb-8">
              The digital lost &amp; found for your campus community. Efficient, searchable,
              and built for students, staff, and security teams alike.
            </p>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="relative flex items-center"
              role="search"
            >
              <Search className="absolute left-4 size-5 text-muted-foreground pointer-events-none" />
              <Input
                aria-label="Search items"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search for keys, wallets, water bottles..."
                className="w-full bg-surface border-border rounded-2xl h-14 pl-12 pr-32 text-base focus-visible:ring-primary/50"
              />
              <Button
                type="submit"
                className="absolute right-2 rounded-xl shadow-glow-primary"
              >
                Search
              </Button>
            </form>

            <div className="flex flex-wrap gap-2 mt-6 items-center">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest py-1">
                Trending:
              </span>
              {["Hydroflask", "AirPods", "ID Card", "Backpack"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQ(tag)}
                  className="text-xs bg-surface hover:bg-surface-2 border border-border px-3 py-1 rounded-full text-muted-foreground transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Filters */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex gap-2 flex-wrap">
            {(["all", "lost", "found"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold border transition-colors capitalize",
                  type === t
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-surface text-muted-foreground border-border hover:border-border/80",
                )}
              >
                {t === "all" ? "All items" : `${t} items`}
              </button>
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            Showing <span className="text-foreground font-medium">{filtered.length}</span> of{" "}
            <span className="text-foreground font-medium">{items.length}</span> reports
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-surface animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl p-16 text-center">
            <h3 className="font-display font-semibold text-lg mb-2">Nothing matches yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {items.length === 0
                ? "Be the first to post — help kick things off."
                : "Try a different search or filter."}
            </p>
            <Button asChild>
              <Link to="/report">Report an item</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Recovery Rate" value={`${stats.rate}%`} accent="secondary" />
          <StatCard label="Items Returned" value={stats.returned.toString()} />
          <StatCard label="Active Reports" value={stats.active.toString()} accent="primary" />
        </div>
      </main>

      <footer className="border-t border-border py-10 mt-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="size-6 bg-primary rounded flex items-center justify-center">
              <div className="size-3 border-2 border-primary-foreground rounded-sm" />
            </div>
            <span className="font-display font-bold text-sm">CAMPUS CONNECT</span>
            <span className="text-muted-foreground text-xs ml-3">Campus lost &amp; found portal.</span>
          </div>
          <div className="flex gap-6 text-xs font-medium text-muted-foreground uppercase tracking-widest">
            <Link to="/" className="hover:text-foreground transition-colors">Feed</Link>
            <Link to="/search" className="hover:text-foreground transition-colors">Search</Link>
            <Link to="/report" className="hover:text-foreground transition-colors">Report</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "primary" | "secondary";
}) {
  return (
    <div className="p-6 rounded-2xl bg-surface/60 border border-border">
      <span className="text-muted-foreground text-xs uppercase tracking-wider">{label}</span>
      <div
        className={cn(
          "text-4xl font-display font-bold mt-2",
          accent === "primary" && "text-primary",
          accent === "secondary" && "text-secondary",
        )}
      >
        {value}
      </div>
    </div>
  );
}
