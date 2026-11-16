// Generador mínimo de PDF (texto, Helvetica, A4) para exportar el checklist sin dependencias externas.
export interface LineaPdf {texto: string; tam?: number; negrita?: boolean; sangria?: number}

const W = 595, H = 842, M = 50;

function esc(texto: string): string {
  return texto.replace(/[^\u0000-ÿ]/g, '?').replace(/[\r\n\t]+/g, ' ').replace(/[\\()]/g, (c) => `\\${c}`);
}

function partir(texto: string, max: number): string[] {
  const salida: string[] = [];
  let actual = '';
  for (let palabra of texto.split(/\s+/)) {
    while (palabra.length > max) {
      if (actual) { salida.push(actual); actual = ''; }
      salida.push(palabra.slice(0, max)); palabra = palabra.slice(max);
    }
    if (!actual) actual = palabra;
    else if ((actual + ' ' + palabra).length <= max) actual += ' ' + palabra;
    else { salida.push(actual); actual = palabra; }
  }
  salida.push(actual);
  return salida;
}

export function generarPdf(lineas: readonly LineaPdf[]): Buffer {
  const paginas: string[] = [];
  let actual: string[] = [];
  let y = H - M;
  for (const linea of lineas) {
    const tam = linea.tam ?? 11, interlineado = tam * 1.4, x = M + (linea.sangria ?? 0);
    const max = Math.max(10, Math.floor((W - M - x) / (tam * 0.5)));
    for (const parte of partir(linea.texto, max)) {
      if (y - interlineado < M) { paginas.push(actual.join('\n')); actual = []; y = H - M; }
      y -= interlineado;
      actual.push(`BT /${linea.negrita ? 'F2' : 'F1'} ${tam} Tf ${x} ${y.toFixed(2)} Td (${esc(parte)}) Tj ET`);
    }
  }
  paginas.push(actual.join('\n'));

  const objetos: string[] = [''];
  objetos[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objetos[2] = `<< /Type /Pages /Kids [${paginas.map((_, i) => `${5 + i * 2} 0 R`).join(' ')}] /Count ${paginas.length} >>`;
  objetos[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objetos[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
  paginas.forEach((contenido, i) => {
    objetos[5 + i * 2] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`;
    objetos[6 + i * 2] = `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`;
  });

  let salida = '%PDF-1.4\n';
  const posiciones: number[] = [];
  for (let i = 1; i < objetos.length; i++) {
    posiciones[i] = salida.length;
    salida += `${i} 0 obj\n${objetos[i]}\nendobj\n`;
  }
  const xref = salida.length;
  salida += `xref\n0 ${objetos.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objetos.length; i++) salida += `${String(posiciones[i]).padStart(10, '0')} 00000 n \n`;
  salida += `trailer\n<< /Size ${objetos.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(salida, 'latin1');
}
