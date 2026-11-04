import type { Metadata } from "next";
import { PublicPage } from "@/components/public/PublicPage";

export const metadata: Metadata = {
  title: "Sobre | Estoque Mercearia",
  description: "Conheça a aplicação de gestão de estoque e como funciona o acesso autorizado.",
};

export default function Sobre() {
  return (
    <PublicPage title="Sobre o Estoque Mercearia" subtitle="Sistema web para controle de estoque e operação de uma pequena mercearia.">
      <section>
        <h2>O que a aplicação faz</h2>
        <p>Centraliza produtos, quantidade disponível, estoque mínimo, entradas, saídas, compras, vendas, alertas e histórico de movimentações. O objetivo é dar rastreabilidade à rotina da mercearia.</p>
      </section>
      <section>
        <h2>Quem pode utilizar</h2>
        <p>O acesso aos dados é restrito a contas autorizadas. Novos cadastros permanecem sem acesso operacional até a aprovação de um administrador, independentemente do método de login utilizado.</p>
      </section>
      <section>
        <h2>Autenticação com Google</h2>
        <p>Quando habilitada, a opção Google permite confirmar a identidade por meio de informações básicas da conta, como identificador, nome e e-mail. Não solicitamos acesso à caixa de entrada do Gmail, aos contatos ou aos arquivos do Google Drive.</p>
      </section>
      <section>
        <h2>Dúvidas sobre acesso e dados pessoais</h2>
        <p>Contato: <a className="underline underline-offset-4" href="mailto:potiguaradm23@gmail.com">potiguaradm23@gmail.com</a>. Consulte também nossa política de privacidade e os termos de uso nos links abaixo.</p>
      </section>
    </PublicPage>
  );
}
