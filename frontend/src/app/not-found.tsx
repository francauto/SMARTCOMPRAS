import { redirect } from "next/navigation";

export default function NotFound() {
  // Redireciona para a página de login
  redirect("/login");
  return null;
}
