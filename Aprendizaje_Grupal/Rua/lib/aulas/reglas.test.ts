import { describe, expect, it } from "vitest";
import { conSufijo, correoDeUsuario, esquemaAvance, generarPin, usuarioBase } from "./reglas";

describe("aulas: cuentas creadas por el docente", () => {
  it("arma un usuario corto sin tildes", () => {
    expect(usuarioBase("María José Quispe")).toBe("mariaq");
    expect(usuarioBase("  Ñusta  ")).toBe("nusta");
    expect(usuarioBase("Juan-Carlos Mamani Condori")).toBe("juanc");
    expect(usuarioBase("!!!")).toBe("alumno");
  });
  it("agrega dos dígitos y usa el correo interno", () => {
    expect(conSufijo("mariaq", () => 0)).toBe("mariaq10");
    expect(conSufijo("mariaq", () => 0.999)).toBe("mariaq99");
    expect(correoDeUsuario("mariaq27")).toBe("mariaq27@alumnos.afj.local");
  });
  it("genera PIN de 6 dígitos", () => {
    for (let i = 0; i < 50; i++) expect(generarPin()).toMatch(/^\d{6}$/);
  });
});

describe("aulas: avance que manda la clase", () => {
  const base = { aprendinId: "a-1", paso: 2, medicion: { "1": [{ estado: "error", nota: "confunde" }, { estado: "entendio" }] } };
  it("acepta un avance válido y completa valores por defecto", () => {
    const a = esquemaAvance.parse(base);
    expect(a.medicion["1"]?.[1]).toEqual({ estado: "entendio", nota: "" });
    expect(a.prueba).toBeNull();
    expect(a.conceptos).toEqual([]);
  });
  it("rechaza estados desconocidos, pasos fuera de rango y notas enormes", () => {
    expect(esquemaAvance.safeParse({ ...base, medicion: { "1": [{ estado: "hackeado" }] } }).success).toBe(false);
    expect(esquemaAvance.safeParse({ ...base, paso: 9 }).success).toBe(false);
    expect(esquemaAvance.safeParse({ ...base, medicion: { "7": [] } }).success).toBe(false);
    expect(esquemaAvance.safeParse({ ...base, medicion: { "1": [{ estado: "vago", nota: "x".repeat(500) }] } }).success).toBe(false);
  });
});
