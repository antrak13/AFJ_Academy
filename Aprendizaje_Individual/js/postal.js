import { svgAprendin } from './aprendin.js';
import { tonos } from './color.js';

export async function descargarPostal(aprendin, fase, misionCumplida) {
  const { look, titulo } = aprendin.fases[fase];
  const tono = tonos(look.color);
  const retrato = new Image();
  retrato.src = `data:image/svg+xml,${encodeURIComponent(svgAprendin(look, { emocion: fase ? 'orgulloso' : 'feliz' }))}`;
  await retrato.decode();

  const lienzo = document.createElement('canvas');
  lienzo.width = 800; lienzo.height = 900;
  const ctx = lienzo.getContext('2d');
  ctx.fillStyle = '#F4EFE6';
  ctx.fillRect(0, 0, 800, 900);
  ctx.fillStyle = '#FCF9F4';
  ctx.beginPath();
  ctx.roundRect(34, 34, 732, 832, 36);
  ctx.fill();
  const fondo = ctx.createRadialGradient(400, 370, 30, 400, 370, 275);
  fondo.addColorStop(0, '#FFFFFF');
  fondo.addColorStop(0.75, tono.claro);
  fondo.addColorStop(1, '#FCF9F4');
  ctx.fillStyle = fondo;
  ctx.fillRect(65, 115, 670, 510);
  ctx.drawImage(retrato, 126, 123, 548, 497);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#214580';
  ctx.font = 'bold 24px system-ui';
  ctx.fillText('APRENDINES', 400, 102);
  ctx.fillStyle = '#232B3E';
  ctx.font = 'bold 56px system-ui';
  ctx.fillText(aprendin.nombre, 400, 672, 660);
  ctx.font = 'bold 28px system-ui';
  ctx.fillText(titulo, 400, 718, 650);
  ctx.font = '26px system-ui';
  ctx.fillText(aprendin.tema, 400, 762, 650);
  ctx.fillStyle = '#214580';
  ctx.font = 'bold 23px system-ui';
  ctx.fillText(misionCumplida ? 'Misión cumplida' : `${fase} de ${aprendin.fases.length - 1} pasos de la misión`, 400, 822, 650);

  const png = await new Promise(resolve => lienzo.toBlob(resolve, 'image/png'));
  if (!png) throw new Error('No se pudo crear la postal');
  const url = URL.createObjectURL(png);
  const descarga = document.createElement('a');
  descarga.href = url;
  descarga.download = `aprendin-${aprendin.nombre.replace(/[^\p{L}\p{N}-]+/gu, '-')}.png`;
  descarga.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
