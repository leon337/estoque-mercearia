import type { Metadata } from "next";
import { PublicPage } from "@/components/public/PublicPage";

export const metadata: Metadata = {
  title: "Privacidade | Estoque Mercearia",
  description: "Informações sobre dados usados na autenticação e na operação do Estoque Mercearia.",
};

export default function Privacidade() {
  return (
    <PublicPage title="Política de privacidade" subtitle="Última atualização: 4 de novembro de 2026. Esta página descreve os dados utilizados pela aplicação e seus objetivos.">
      <section>
        <h2>Dados tratados</h2>
        <p>Para criar e gerenciar contas, utilizamos nome, e-mail, identificador de usuário, método de autenticação, papel de acesso, situação de aprovação e dados de sessão necessários à segurança. Durante o uso, registramos informações das operações de estoque vinculadas à conta responsável, conforme os recursos utilizados.</p>
      </section>
      <section>
        <h2>Finalidades</h2>
        <p>Utilizamos essas informações para autenticar usuários, verificar permissões, administrar aprovações, executar operações autorizadas, manter histórico operacional, investigar erros e proteger o sistema contra uso indevido.</p>
      </section>
      <section>
        <h2>Google e fornecedores técnicos</h2>
        <p>Quando você escolhe entrar com Google, o Google autentica sua identidade e o Supabase Auth recebe os dados básicos necessários à conta, como identificador, nome e e-mail. A aplicação não solicita acesso ao Gmail, Google Drive ou aos contatos. A autenticação e o banco de dados são operados pelo Supabase; a hospedagem da aplicação é realizada no Render. Esses serviços podem processar dados técnicos necessários à prestação do serviço.</p>
      </section>
      <section>
        <h2>Cookies, segurança e conservação</h2>
        <p>Usamos cookies técnicos e informações de sessão para manter a autenticação. Os registros de acesso e as operações são conservados pelo período necessário à utilização, auditoria operacional e obrigações aplicáveis. O acesso a dados e funcionalidades depende do perfil autorizado; novas contas não recebem permissão operacional automaticamente.</p>
      </section>
      <section>
        <h2>Solicitações e contato</h2>
        <p>Para solicitar esclarecimentos, correção ou revisão de dados de sua conta, inclusive pedidos de exclusão quando cabíveis, escreva para <a className="underline underline-offset-4" href="mailto:potiguaradm23@gmail.com">potiguaradm23@gmail.com</a>. A solicitação poderá exigir verificação de identidade e avaliação de registros que precisam ser mantidos por obrigações legais ou operacionais.</p>
      </section>
    </PublicPage>
  );
}
