import { createFileRoute, Link } from "@tanstack/react-router";

const CANONICAL = "https://cc-certa.lovable.app/modelos-de-cobranca";

export const Route = createFileRoute("/modelos-de-cobranca")({
  head: () => ({
    meta: [
      { title: "Mensagem de cobrança para cliente: 12 modelos prontos" },
      {
        name: "description",
        content:
          "Modelos de mensagem de cobrança para cliente: lembrete antes do vencimento, aviso no dia e cobrança de atraso. Textos prontos para WhatsApp e e-mail.",
      },
      {
        property: "og:title",
        content: "Mensagem de cobrança para cliente: 12 modelos prontos",
      },
      {
        property: "og:description",
        content:
          "Textos prontos e educados para lembrar, avisar e cobrar clientes atrasados por WhatsApp ou e-mail.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Mensagem de cobrança para cliente: 12 modelos prontos",
          description:
            "Modelos de mensagem de cobrança para cliente em três momentos: antes do vencimento, no dia e em atraso.",
          inLanguage: "pt-BR",
          mainEntityOfPage: CANONICAL,
        }),
      },
    ],
  }),
  component: ModelosPage,
});

type Bloco = {
  id: string;
  titulo: string;
  resumo: string;
  modelos: { rotulo: string; texto: string }[];
};

const BLOCOS: Bloco[] = [
  {
    id: "antes-do-vencimento",
    titulo: "Antes do vencimento",
    resumo:
      "Enviado de 3 a 5 dias antes. O tom é de lembrete, nunca de cobrança — a maior parte dos atrasos é esquecimento.",
    modelos: [
      {
        rotulo: "Lembrete simples",
        texto:
          "Oi, {cliente}! Passando para lembrar que o pagamento de {serviço}, no valor de {valor}, vence em {data}. Qualquer dúvida é só me chamar por aqui.",
      },
      {
        rotulo: "Com dados de pagamento",
        texto:
          "Olá, {cliente}! O vencimento de {valor} referente a {serviço} é dia {data}. Segue a chave Pix para facilitar: {chave}. Assim que cair eu confirmo por aqui.",
      },
      {
        rotulo: "Cliente recorrente",
        texto:
          "Oi, {cliente}, tudo bem? Como sempre, deixo o aviso com antecedência: {valor} de {serviço} vence em {data}. Obrigado pela parceria!",
      },
      {
        rotulo: "Com nota fiscal",
        texto:
          "Olá, {cliente}! Segue a nota fiscal de {serviço} no valor de {valor}, com vencimento em {data}. Se precisar de algum ajuste no documento, me avise antes da data.",
      },
    ],
  },
  {
    id: "no-dia-do-vencimento",
    titulo: "No dia do vencimento",
    resumo:
      "Curto, direto e sem cobrança emocional. O objetivo é só deixar o pagamento fácil de fazer hoje.",
    modelos: [
      {
        rotulo: "Aviso do dia",
        texto:
          "Oi, {cliente}! O pagamento de {valor} referente a {serviço} vence hoje. Envio a chave Pix aqui para agilizar: {chave}.",
      },
      {
        rotulo: "Com opção de parcelar",
        texto:
          "Olá, {cliente}! Hoje é o vencimento de {valor} de {serviço}. Se ficar apertado, conseguimos dividir em duas partes — é só me dizer.",
      },
      {
        rotulo: "Pedido de confirmação",
        texto:
          "Oi, {cliente}! Vence hoje o valor de {valor} de {serviço}. Se já tiver feito o pagamento, pode me mandar o comprovante que eu dou baixa.",
      },
      {
        rotulo: "Formal, por e-mail",
        texto:
          "Prezado(a) {cliente}, informamos que a cobrança de {valor}, referente a {serviço}, vence nesta data ({data}). Permanecemos à disposição para qualquer esclarecimento.",
      },
    ],
  },
  {
    id: "cobranca-em-atraso",
    titulo: "Cobrança em atraso",
    resumo:
      "Firme, educado e com um próximo passo claro. Registre sempre a data de cada tentativa de contato.",
    modelos: [
      {
        rotulo: "Primeiro aviso (1 a 3 dias)",
        texto:
          "Oi, {cliente}! Notei que o pagamento de {valor} de {serviço}, com vencimento em {data}, ainda não caiu. Pode ter passado batido — consegue me confirmar uma nova data?",
      },
      {
        rotulo: "Segundo aviso (7 a 15 dias)",
        texto:
          "Olá, {cliente}. O valor de {valor} de {serviço} está em atraso desde {data}. Preciso regularizar essa pendência: consegue efetuar o pagamento até {novo prazo}?",
      },
      {
        rotulo: "Proposta de acordo",
        texto:
          "Oi, {cliente}. Sobre a pendência de {valor} de {serviço}, prefiro resolver junto com você. Posso dividir em {n} parcelas a partir de {data}. Fechamos assim?",
      },
      {
        rotulo: "Último aviso antes de suspender",
        texto:
          "Prezado(a) {cliente}, a cobrança de {valor}, vencida em {data}, segue em aberto mesmo após nossos contatos. Sem o pagamento ou uma proposta até {prazo final}, precisarei suspender os serviços e encaminhar o débito para cobrança formal.",
      },
    ],
  },
];

const BOAS_PRATICAS = [
  "Troque {cliente}, {serviço}, {valor} e {data} pelos dados reais antes de enviar — mensagem genérica é ignorada.",
  "Combine o prazo de pagamento por escrito no início do trabalho; a cobrança fica muito mais simples depois.",
  "Mande sempre a forma de pagamento junto: quanto menos passos, mais rápido você recebe.",
  "Escolha horário comercial. Cobrança à noite ou no fim de semana costuma gerar atrito.",
  "Anote cada contato feito. Esse histórico serve para negociar e, se precisar, para uma cobrança formal.",
];

function ModelosPage() {
  return (
    <main className="min-h-svh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              CC
            </span>
            <span className="font-semibold tracking-tight">Cobrança Certa</span>
          </Link>
          <Link
            to="/auth"
            className="rounded-md border border-input px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            Entrar
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Mensagem de cobrança para cliente: 12 modelos prontos
        </h1>
        <p className="mt-3 text-muted-foreground">
          Cobrar não precisa ser desconfortável. Abaixo estão textos prontos para os três momentos
          que importam — antes do vencimento, no dia e quando o pagamento atrasa. Copie, troque os
          dados entre chaves e envie por WhatsApp ou e-mail.
        </p>

        <nav aria-label="Índice" className="mt-6 flex flex-wrap gap-2">
          {BLOCOS.map((b) => (
            <a
              key={b.id}
              href={`#${b.id}`}
              className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {b.titulo}
            </a>
          ))}
        </nav>

        {BLOCOS.map((bloco) => (
          <section key={bloco.id} id={bloco.id} className="mt-10 scroll-mt-6">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">{bloco.titulo}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{bloco.resumo}</p>
            <div className="mt-4 space-y-3">
              {bloco.modelos.map((m) => (
                <div key={m.rotulo} className="rounded-lg border border-border p-4">
                  <h3 className="text-sm font-semibold text-foreground">{m.rotulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                    {m.texto}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Como aumentar a chance de receber
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {BOAS_PRATICAS.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-lg border border-border bg-muted/40 p-6">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Deixe os lembretes no automático
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            O Cobrança Certa envia o lembrete no vencimento e a cobrança firme depois, sem você
            precisar escrever nada. Você acompanha o que foi enviado e o que já foi pago.
          </p>
          <Link
            to="/auth"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Começar agora
          </Link>
        </section>
      </article>
    </main>
  );
}
