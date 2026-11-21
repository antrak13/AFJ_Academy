// Mundos de ejemplo: cada uno es un look armado con piezas del catálogo.
// En la clase, la IA arma el look para cualquier mundo que escriba el estudiante; estos sirven de muestra y de respaldo sin IA.

export const MUNDOS = [
  { id: 'cocina', nombre: 'Cocina', de: 'de la cocina', look: { nombre: 'Pancho', forma: 'bollo', color: 'mandarina', piezas: { cabeza: 'gorro_chef', cara: 'bigote', cuello: { id: 'panuelo', colores: ['coral', 'nieve'] }, cuerpo: 'delantal', mano: 'cuchara', aura: 'chispas' } } },
  { id: 'futbol', nombre: 'Fútbol', de: 'de la cancha', look: { nombre: 'Goli', forma: 'huevo', color: 'lima', numero: 10, piezas: { pelo: 'puntas', cara: { id: 'pintura', colores: ['cielo', 'nieve'] }, cuello: 'silbato', cuerpo: { id: 'camiseta', colores: ['nieve', 'cielo'] }, mano: 'pelota', aura: 'chispas' } } },
  { id: 'basquet', nombre: 'Básquet', de: 'de la cancha de básquet', look: { nombre: 'Rebo', forma: 'torre', color: 'coral', numero: 23, piezas: { cabeza: 'vincha', cuerpo: { id: 'camiseta', colores: ['indigo', 'sol'] }, mano: 'balon', cuello: 'medalla', aura: 'fuego' } } },
  { id: 'musica', nombre: 'Música', de: 'del escenario', look: { nombre: 'Rima', forma: 'gota', color: 'uva', piezas: { cabeza: 'audifonos', cara: 'lentes_sol', cuello: 'lazo', mano: 'microfono', aura: 'notas' } } },
  { id: 'bloques', nombre: 'Bloques', de: 'de un mundo de bloques', look: { nombre: 'Cubi', forma: 'cubo', color: 'menta', piezas: { cuerpo: 'pixeles', mano: 'pico', espalda: 'mochila', aura: 'chispas' } } },
  { id: 'espacio', nombre: 'Espacio', de: 'del espacio', look: { nombre: 'Nova', forma: 'huevo', color: 'indigo', piezas: { cabeza: 'visera', cuerpo: 'traje', espalda: 'propulsor', mano: 'lupa', aura: 'chispas' } } },
  { id: 'magia', nombre: 'Magia', de: 'de una escuela de magia', look: { nombre: 'Mimi', forma: 'gota', color: 'chicle', piezas: { cabeza: 'mago', mano: 'varita', espalda: 'capa', cuello: { id: 'lazo', colores: ['sol', 'nieve'] }, aura: 'chispas' } } },
  { id: 'ciencia', nombre: 'Ciencia', de: 'del laboratorio', look: { nombre: 'Eureko', forma: 'pera', color: 'cielo', piezas: { pelo: 'rulos', cara: 'lentes', cuerpo: 'bata', mano: 'probeta', aura: 'burbujas' } } },
  { id: 'arte', nombre: 'Arte', de: 'del taller de arte', look: { nombre: 'Tinta', forma: 'bollo', color: 'sol', piezas: { cabeza: 'boina', cara: 'pecas', cuello: 'bufanda', mano: 'pincel', aura: 'chispas' } } },
  { id: 'andes', nombre: 'Andes', de: 'de los Andes', look: { nombre: 'Wayra', forma: 'bollo', color: 'cacao', piezas: { cabeza: 'chullo', cara: 'pecas', cuerpo: 'aguayo', mano: 'flor', aura: 'chispas' } } },
  { id: 'piratas', nombre: 'Piratas', de: 'de un barco pirata', look: { nombre: 'Barbi', forma: 'pera', color: 'nieve', piezas: { cabeza: 'bandana', cara: 'parche', cuerpo: 'rayas', mano: 'espada', espalda: 'cola' } } },
  { id: 'videojuegos', nombre: 'Videojuegos', de: 'de un videojuego', look: { nombre: 'Pixel', forma: 'torre', color: 'uva', piezas: { pelo: 'cresta', cara: 'visor', cabeza: 'audifonos', mano: 'control', aura: 'rayos' } } }
];

export const NOMBRES = ['Tito', 'Lulu', 'Coco', 'Pipo', 'Nina', 'Bubu', 'Kiki', 'Toto', 'Mora', 'Chispa', 'Pacho', 'Luna', 'Rufo', 'Tika', 'Bolo', 'Quina'];
