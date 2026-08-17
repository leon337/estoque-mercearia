export type Role = "ADMIN" | "OPERATOR";
export type NavItem = { href: string; label: string; adminOnly?: boolean };

const navigation: NavItem[] = [
  { href: "/", label: "Painel" },
  { href: "/products", label: "Produtos" },
  { href: "/inventory", label: "Estoque" },
  { href: "/movements/new", label: "Movimentações" },
  { href: "/history", label: "Histórico" },
  { href: "/admin/users", label: "Administração", adminOnly: true },
];

export function getNavigation(role: Role): NavItem[] {
  return navigation.filter((item) => !item.adminOnly || role === "ADMIN");
}

export function isNavActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
