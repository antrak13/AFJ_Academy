import path from "node:path";
import type { NextConfig } from "next";

// app/[...ruta]/route.ts sirve páginas que viven fuera de esta carpeta (inicio, login, el módulo
// de Andre y los aprendines). Para que entren en el despliegue (Vercel), el rastreo de archivos
// parte de la raíz del repositorio y se incluyen de forma explícita.
const PAGINAS_DEL_EQUIPO = [
  "../../inicio.html",
  "../../login.html",
  "../../demov1.html",
  "../../Aprendizaje_Grupal/Andre/Oficial/*.html",
  "../../Aprendizaje_Grupal/Andre/Oficial/css/**/*",
  "../../Aprendizaje_Grupal/Andre/Oficial/js/**/*",
  "../../Aprendizaje_Individual/*.html",
  "../../Aprendizaje_Individual/css/**/*",
  "../../Aprendizaje_Individual/js/**/*",
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  outputFileTracingIncludes: {
    "/[...ruta]": PAGINAS_DEL_EQUIPO,
  },
};

export default nextConfig;
