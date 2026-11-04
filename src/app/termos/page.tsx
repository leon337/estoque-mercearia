import type { Metadata } from "next";
import { PublicPage } from "@/components/public/PublicPage";

export const metadata: Metadata = {
  title: "Termos de uso | Estoque Mercearia",
  description: "Condições básicas de uso da aplicação Estoque Mercearia.",
};

export default function Termos() {
  return (
    <PublicPage title="Termos de uso" subtitle="Última atualização: 4 de novembro de 2026.">
      <section>
        <h2>Acesso autorizado</h2>
        <p>O Estoque Mercearia é um sistema de gestão operacional destinado a usuários autorizados pela administração da aplicação. Criar uma conta ou autenticar-se com Google não concede, por si só, permissão para acessar dados internos.</p>
      </section>
      <section>
        <h2>Uso responsável</h2>
        <p>Cada usuário deve utilizar sua própria conta, manter suas credenciais protegidas e registrar movimentações de estoque de forma correta. Não é permitido acessar informações de terceiros sem autorização, contornar restrições de acesso ou manipular registros intencionalmente.</p>
      </section>
      <section>
        <h2>Perfis e mudanças</h2>
        <p>Administradores podem aprovar, suspender ou revisar permissões conforme a necessidade operacional. Funcionalidades e procedimentos poderão ser modificados para manutenção, segurança e melhoria da aplicação.</p>
      </section>
      <section>
        <h2>Dados pessoais</h2>
        <p>A utilização da aplicação envolve dados de cadastro e registros de operação. Consulte a Política de privacidade, disponível no rodapé, para saber quais informações são usadas e como solicitar esclarecimentos.</p>
      </section>
      <section>
        <h2>Contato</h2>
        <p>Dúvidas sobre o acesso ou sobre estas condições podem ser encaminhadas a <a className="underline underline-offset-4" href="mailto:potiguaradm23@gmail.com">potiguaradm23@gmail.com</a>.</p>
      </section>
    </PublicPage>
  );
}
