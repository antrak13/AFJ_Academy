import { redirect } from "next/navigation";

// La portada de la plataforma es inicio.html (Andre), servida por app/[...ruta]/route.ts.
export default function Inicio() {
  redirect("/inicio.html");
}
