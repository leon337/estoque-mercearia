export type Role = "ADMIN" | "OPERATOR";
export type AppRoute = "/" | "/products" | "/suppliers" | "/purchases" | "/inventory" | "/movements/new" | "/history" | "/admin/users";
export type NavItem = { href: AppRoute; label: string; adminOnly?: boolean };

const navigation: NavItem[] = [
  { href: "/", label: "Painel" },
  { href: "/products", label: "Produtos" },
  { href: "/suppliers", label: "Fornecedores" },
  { href: "/purchases", label: "Compras" },
  { href: "/inventory", label: "Estoque" },
  { href: "/movements/new", label: "Movimentações" },
  { href: "/history", label: "Histórico" },
  { href: "/admin/users", label: "Administração", adminOnly: true },
];

export function getNavigation(role: Role): NavItem[] {
  return navigation.filter((item) => !item.adminOnly || role === "ADMIN");
}

export function isNavActive(pathname: string, href: AppRoute): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/admin/users") return pathname.startsWith("/admin");
  return pathname === href || pathname.startsWith(`${href}/`);
}
