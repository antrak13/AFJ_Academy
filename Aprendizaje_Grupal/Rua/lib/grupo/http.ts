import "server-only";

/** Tipos de contexto de las rutas dinámicas (Next 16 entrega params como promesa). */
export type CtxSala = { params: Promise<{ codigo: string }> };
export type CtxCheckpoint = { params: Promise<{ codigo: string; checkpointId: string }> };
