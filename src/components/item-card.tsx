import { Link } from "@tanstack/react-router";
import { MapPin, Clock } from "lucide-react";
import { relativeTime } from "@/lib/campus";
import { cn } from "@/lib/utils";

export interface ItemCardData {
  id: string;
  type: "lost" | "found";
  title: string;
  description: string;
  category: string;
  location: string;
  image_url: string | null;
  status: "active" | "returned";
  created_at: string;
}

export function ItemCard({ item }: { item: ItemCardData }) {
  const isLost = item.type === "lost";
  const returned = item.status === "returned";

  return (
    <Link
      to="/items/$id"
      params={{ id: item.id }}
      className={cn(
        "group bg-surface border border-border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col focus:outline-none focus:ring-2 focus:ring-ring",
        isLost ? "hover:border-danger/50" : "hover:border-secondary/50",
        returned && "opacity-70",
      )}
    >
      <div className="w-full aspect-[4/3] bg-surface-2 grid place-items-center relative overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
            No photo
          </span>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span
            className={cn(
              "text-[10px] font-bold px-2 py-1 rounded uppercase tracking-tighter",
              isLost ? "bg-danger text-danger-foreground" : "bg-secondary text-secondary-foreground",
            )}
          >
            {item.type}
          </span>
          {returned && (
            <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-tighter bg-foreground/90 text-background">
              Returned
            </span>
          )}
        </div>
        <span className="absolute top-3 right-3 text-[10px] font-medium px-2 py-1 rounded bg-background/70 backdrop-blur text-muted-foreground">
          {item.category}
        </span>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="font-display font-semibold text-lg leading-tight">{item.title}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{item.description}</p>
        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 truncate">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{item.location}</span>
          </span>
          <span className="flex items-center gap-1.5 shrink-0">
            <Clock className="size-3.5" />
            {relativeTime(item.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}
