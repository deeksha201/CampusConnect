// Sticky top nav — shows session-aware sign-in / account state.
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, User as UserIcon, Search, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/", replace: true });
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center shadow-glow-primary">
            <div className="size-4 border-2 border-primary-foreground rounded-sm" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight hidden sm:inline">
            CAMPUS CONNECT
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition-colors">
            Feed
          </Link>
          <Link to="/search" activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition-colors">
            Search
          </Link>
          {user && (
            <Link to="/my-reports" activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition-colors">
              My Reports
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="md:hidden" aria-label="Search">
            <Link to="/search"><Search className="size-4" /></Link>
          </Button>
          <Button asChild size="sm" className="shadow-glow-primary">
            <Link to="/report"><Plus className="size-4" /> <span className="hidden sm:inline">Report Item</span></Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Account menu">
                  <UserIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="truncate max-w-[220px]">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/my-reports">My reports</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/report">Report an item</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
