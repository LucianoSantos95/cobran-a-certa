import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EMAIL_AUTORIZADO } from "@/lib/acesso";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppNav({ userId, email }: { userId: string; email: string }) {
  const navigate = useNavigate();
  const isAdmin = email.trim().toLowerCase() === EMAIL_AUTORIZADO;

  const { data: perfil } = useQuery({
    queryKey: ["meu-perfil", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("nome, avatar_url")
        .eq("id", userId)
        .maybeSingle();
      return data ?? { nome: "", avatar_url: null };
    },
  });

  const links = [
    { to: "/", label: "Painel" },
    ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
  ] as const;

  async function sair() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const nome = perfil?.nome?.trim() || "";
  const iniciais = (nome[0] || email.trim()[0] || "?").toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-6 place-items-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
            CC
          </span>
          <span className="hidden sm:inline">Cobrança Certa</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: true }}
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{
                className: "rounded-md px-3 py-1.5 bg-muted font-medium !text-foreground",
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 gap-2 px-2">
                <Avatar className="size-6">
                  {perfil?.avatar_url ? <AvatarImage src={perfil.avatar_url} alt={nome} /> : null}
                  <AvatarFallback className="text-[10px]">{iniciais}</AvatarFallback>
                </Avatar>
                <span className="hidden max-w-40 truncate text-sm text-muted-foreground md:inline">
                  {nome || email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="truncate text-sm text-foreground">{nome || "Sua conta"}</div>
                <div className="truncate text-xs text-muted-foreground">{email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/configuracoes">Minha conta</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={sair}>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
