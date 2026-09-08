import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MeuPerfil {
  nome: string;
  avatar_url: string | null;
}

/**
 * Perfil do usuário logado (nome + foto). Chave compartilhada por AppNav,
 * FeedbackButton e a tela Minha conta — salvar o nome ali invalida
 * ["meu-perfil"] e todos refletem na hora.
 */
export function useMeuPerfil(userId: string) {
  return useQuery<MeuPerfil>({
    queryKey: ["meu-perfil", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("nome, avatar_url")
        .eq("id", userId)
        .maybeSingle();
      let url: string | null = null;
      const guardado = data?.avatar_url ?? null;
      if (guardado) {
        // O bucket é privado: guardamos só o caminho e assinamos na leitura.
        const { data: assinada } = await supabase.storage
          .from("avatars")
          .createSignedUrl(guardado, 60 * 60);
        url = assinada?.signedUrl ?? null;
      }
      return { nome: data?.nome ?? "", avatar_url: url };
    },

  });
}
