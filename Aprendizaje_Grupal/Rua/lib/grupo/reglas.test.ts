import { describe, expect, it } from "vitest";
import { calcularSincronia, causaDesfase, esperaCumplida, mediana } from "./sincronia";
import { calcularVentanas, esRetroceso, ventanaDe } from "./friccion";
import { efectosVoz, estadoVozInicial, reducirVoz, type EstadoVoz } from "./voz";
import {
  debeCerrarDebate,
  debeRevelar,
  esquemaCheckpoint,
  nuevoDominio,
  resolverRevelacion,
  resultadoVoto,
  vistaRonda,
  type Ronda,
} from "./control";
import { elegirNuevoAnfitrion, generarCodigo } from "./salas";

describe("sincronía (reglas 6 a 9)", () => {
  it("calcula la mediana", () => {
    expect(mediana([])).toBeNull();
    expect(mediana([3, 1, 2])).toBe(2);
    expect(mediana([1, 2, 3, 4])).toBe(2.5);
  });

  it("Carlos en 0:36 contra el resto en 1:10 está desfasado", () => {
    const r = calcularSincronia([
      { userId: "ana", posicion: 70 },
      { userId: "beto", posicion: 71 },
      { userId: "carlos", posicion: 36 },
      { userId: "dani", posicion: 69 },
    ]);
    expect(r.integrantes.find((i) => i.userId === "carlos")!.desfasado).toBe(true);
    expect(r.integrantes.find((i) => i.userId === "ana")!.desfasado).toBe(false);
    expect(r.sincronizados).toBe(3);
    expect(r.total).toBe(4);
  });

  it("exactamente 30 s no cuenta como desfase", () => {
    const r = calcularSincronia([
      { userId: "a", posicion: 100 },
      { userId: "b", posicion: 70 },
    ]);
    expect(r.sincronizados).toBe(2);
  });

  it("deriva la causa del aviso", () => {
    const base = { estado: "viendo" as const, cuadernoActivo: false, pausaPorVoz: false, retrocedio: false };
    expect(causaDesfase({ ...base, cuadernoActivo: true })).toBe("tomando_notas");
    expect(causaDesfase({ ...base, estado: "pausado" })).toBe("en_pausa");
    expect(causaDesfase({ ...base, retrocedio: true })).toBe("repasando");
    expect(causaDesfase({ ...base, estado: "pausado", pausaPorVoz: true })).toBe("conversando");
    expect(causaDesfase(base)).toBeNull();
  });

  it("la espera se cumple cuando la otra persona me alcanza", () => {
    expect(esperaCumplida(70, 50)).toBe(false);
    expect(esperaCumplida(70, 70)).toBe(true);
  });
});

describe("zonas de fricción (reglas 10 a 12)", () => {
  it("un retroceso es de 5 s o más", () => {
    expect(esRetroceso(100, 96)).toBe(false);
    expect(esRetroceso(100, 95)).toBe(true);
    expect(esRetroceso(50, 80)).toBe(false);
  });

  it("agrupa en ventanas de 30 s", () => {
    expect(ventanaDe(0)).toBe(0);
    expect(ventanaDe(29.9)).toBe(0);
    expect(ventanaDe(30)).toBe(30);
    expect(ventanaDe(95)).toBe(90);
  });

  it("es zona con 2 integrantes distintos, no con 2 retrocesos de la misma persona", () => {
    const v = calcularVentanas([
      { userId: "a", ventanaInicio: 60 },
      { userId: "a", ventanaInicio: 60 },
      { userId: "a", ventanaInicio: 90 },
      { userId: "b", ventanaInicio: 90 },
    ]);
    expect(v).toEqual([
      { ventanaInicio: 60, ventanaFin: 90, retrocesos: 2, integrantes: 1, esZona: false },
      { ventanaInicio: 90, ventanaFin: 120, retrocesos: 2, integrantes: 2, esZona: true },
    ]);
  });
});

describe("pausa por voz (reglas 13 a 15)", () => {
  const correr = (eventos: Parameters<typeof reducirVoz>[1][]) => eventos.reduce<EstadoVoz>(reducirVoz, estadoVozInicial);

  it("pausa y baja el volumen al 15 % cuando alguien habla", () => {
    const e = correr([{ tipo: "oradores", hablando: true, reproduciendo: true, ahora: 0 }]);
    expect(efectosVoz(e, 0)).toEqual({ pausado: true, volumen: 0.15, cuenta: null });
  });

  it("tras 3 s de silencio cuenta 3, 2, 1 y reanuda", () => {
    let e = correr([
      { tipo: "oradores", hablando: true, reproduciendo: true, ahora: 0 },
      { tipo: "oradores", hablando: false, reproduciendo: false, ahora: 1000 },
      { tipo: "tick", ahora: 3999 },
    ]);
    expect(e.modo).toBe("pausa_voz");
    e = reducirVoz(e, { tipo: "tick", ahora: 4000 });
    expect(efectosVoz(e, 4000).cuenta).toBe(3);
    expect(efectosVoz(e, 5500).cuenta).toBe(2);
    expect(efectosVoz(e, 6500).cuenta).toBe(1);
    e = reducirVoz(e, { tipo: "tick", ahora: 7000 });
    expect(efectosVoz(e, 7000)).toEqual({ pausado: false, volumen: 1, cuenta: null });
  });

  it("si vuelven a hablar durante la cuenta, se cancela", () => {
    const e = correr([
      { tipo: "oradores", hablando: true, reproduciendo: true, ahora: 0 },
      { tipo: "oradores", hablando: false, reproduciendo: false, ahora: 0 },
      { tipo: "tick", ahora: 3000 },
      { tipo: "oradores", hablando: true, reproduciendo: false, ahora: 3500 },
    ]);
    expect(e).toEqual({ modo: "pausa_voz", silencioDesde: null });
  });

  it("mantener pausa cancela la reanudación automática", () => {
    let e = correr([
      { tipo: "oradores", hablando: true, reproduciendo: true, ahora: 0 },
      { tipo: "mantener_pausa" },
      { tipo: "oradores", hablando: false, reproduciendo: false, ahora: 100 },
      { tipo: "tick", ahora: 60_000 },
    ]);
    expect(e.modo).toBe("pausa_mantenida");
    e = reducirVoz(e, { tipo: "reanudar_manual" });
    expect(e.modo).toBe("normal");
  });

  it("no toma el control si yo ya había pausado a mano", () => {
    const e = correr([{ tipo: "oradores", hablando: true, reproduciendo: false, ahora: 0 }]);
    expect(e.modo).toBe("normal");
  });
});

describe("puntos de control (reglas 17 a 23)", () => {
  const ronda = (r: Partial<Ronda>): Ronda => ({
    id: "r",
    fase: "votacion",
    primer_voto_en: null,
    debate_hasta: null,
    cerrada_en: null,
    resultado: null,
    votos_divididos: false,
    ...r,
  });
  const t0 = new Date("2026-11-21T10:00:00Z");

  it("valida el punto de control", () => {
    const ok = { segundo: 70, pregunta: "¿Qué?", opciones: ["a", "b"], correcta: 1, explicacion: "x" };
    expect(esquemaCheckpoint.safeParse(ok).success).toBe(true);
    expect(esquemaCheckpoint.safeParse({ ...ok, opciones: ["a"] }).success).toBe(false);
    expect(esquemaCheckpoint.safeParse({ ...ok, opciones: ["a", "b", "c", "d", "e"] }).success).toBe(false);
    expect(esquemaCheckpoint.safeParse({ ...ok, correcta: 2 }).success).toBe(false);
  });

  it("revela cuando todos votaron o a los 120 s del primer voto", () => {
    const r = ronda({ primer_voto_en: t0.toISOString() });
    expect(debeRevelar(r, 0, 3, t0)).toBe(false);
    expect(debeRevelar(r, 2, 3, new Date(t0.getTime() + 60_000))).toBe(false);
    expect(debeRevelar(r, 3, 3, t0)).toBe(true);
    expect(debeRevelar(r, 2, 3, new Date(t0.getTime() + 120_000))).toBe(true);
    expect(debeRevelar(ronda({ fase: "debate" }), 3, 3, t0)).toBe(false);
  });

  it("combo perfecto: una sola opción y correcta, sin debate", () => {
    const v = [
      { user_id: "a", voto_inicial: 1, voto_final: null },
      { user_id: "b", voto_inicial: 1, voto_final: null },
    ];
    expect(resolverRevelacion(v, 1, t0)).toMatchObject({ fase: "cerrada", resultado: "combo_perfecto" });
    expect(resolverRevelacion(v, 0, t0)).toMatchObject({ fase: "cerrada", resultado: "unanime_incorrecta" });
  });

  it("votos divididos abren 90 s de debate", () => {
    const r = resolverRevelacion(
      [
        { user_id: "a", voto_inicial: 0, voto_final: null },
        { user_id: "b", voto_inicial: 1, voto_final: null },
      ],
      1,
      t0,
    );
    expect(r).toMatchObject({ fase: "debate", votos_divididos: true });
    expect(new Date(r.debate_hasta!).getTime() - t0.getTime()).toBe(90_000);
    const enDebate = ronda({ ...r });
    expect(debeCerrarDebate(enDebate, new Date(t0.getTime() + 89_999))).toBe(false);
    expect(debeCerrarDebate(enDebate, new Date(t0.getTime() + 90_000))).toBe(true);
  });

  it("registra acierto y cambio de voto", () => {
    expect(resultadoVoto({ user_id: "a", voto_inicial: 0, voto_final: 1 }, 1)).toEqual({
      final: 1,
      acierto: true,
      aciertoInicial: false,
      cambio: true,
    });
    expect(resultadoVoto({ user_id: "a", voto_inicial: 1, voto_final: null }, 1).cambio).toBe(false);
  });

  it("el dominio sube con aciertos y baja con errores, dentro de 0..1", () => {
    expect(nuevoDominio(null, true)).toBeCloseTo(0.65);
    expect(nuevoDominio(0.5, false)).toBeCloseTo(0.35);
    expect(nuevoDominio(1, true)).toBe(1);
    expect(nuevoDominio(0, false)).toBe(0);
  });

  it("los votos son a ciegas hasta revelar y la respuesta solo se ve al cerrar", () => {
    const cp = { id: "c", segundo: 70, pregunta: "¿?", opciones: ["a", "b"], correcta: 1, explicacion: "porque" };
    const votos = [
      { user_id: "a", voto_inicial: 0, voto_final: null },
      { user_id: "b", voto_inicial: 1, voto_final: null },
    ];
    const enVotacion = vistaRonda(ronda({}), votos, cp, "a", 3);
    expect(enVotacion.votos).toBeNull();
    expect(enVotacion.votantes).toEqual(["a", "b"]);
    expect(enVotacion.miVoto).toEqual({ inicial: 0, final: null });
    expect(enVotacion.correcta).toBeNull();
    expect(JSON.stringify(enVotacion)).not.toContain("porque");

    const enDebate = vistaRonda(ronda({ fase: "debate" }), votos, cp, "a", 3);
    expect(enDebate.votos).toHaveLength(2);
    expect(enDebate.correcta).toBeNull();

    const cerrada = vistaRonda(ronda({ fase: "cerrada", resultado: "debate" }), votos, cp, "a", 3);
    expect(cerrada.correcta).toBe(1);
    expect(cerrada.explicacion).toBe("porque");
  });
});

describe("salas (reglas 2 y 4)", () => {
  it("genera códigos de 6 caracteres legibles", () => {
    const c = generarCodigo();
    expect(c).toMatch(/^[A-Z0-9]{6}$/);
    expect(c).not.toMatch(/[01OI]/);
  });

  it("el rol pasa a quien lleva más tiempo conectado", () => {
    const m = [
      { user_id: "host", rol: "anfitrion" as const, unido_en: "2026-11-21T10:00:00Z" },
      { user_id: "b", rol: "integrante" as const, unido_en: "2026-11-21T10:02:00Z" },
      { user_id: "a", rol: "integrante" as const, unido_en: "2026-11-21T10:01:00Z" },
    ];
    expect(elegirNuevoAnfitrion(m, "host")).toBe("a");
    expect(elegirNuevoAnfitrion(m, "host", ["host", "b"])).toBe("b");
    expect(elegirNuevoAnfitrion([m[0]], "host")).toBeNull();
  });
});

import { limpiarHtml, esquemaBloque } from "./cuaderno";

describe("cuaderno", () => {
  it("conserva el formato básico y quita atributos", () => {
    expect(limpiarHtml('<b class="x">hola</b> <i>y</i> <code>c</code><br/>')).toBe("<b>hola</b> <i>y</i> <code>c</code><br>");
  });
  it("quita scripts, eventos y etiquetas no permitidas", () => {
    expect(limpiarHtml('<img src=x onerror="alert(1)">a<script>alert(2)</script><div>b</div>')).toBe("ab");
    expect(limpiarHtml('<a href="javascript:x">link</a>')).toBe("link");
  });
  it("exige imagen en un fotograma", () => {
    expect(esquemaBloque.safeParse({ orden: 1, tipo: "fotograma", html: "" }).success).toBe(false);
    expect(esquemaBloque.safeParse({ orden: 1, tipo: "texto", html: "x" }).success).toBe(true);
  });
});
