const MAYUSCULAS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const MINUSCULAS = "abcdefghijkmnopqrstuvwxyz";
const NUMEROS = "23456789";
const SIMBOLOS = "!@#$%&*";
const TODOS = MAYUSCULAS + MINUSCULAS + NUMEROS + SIMBOLOS;

function aleatorio(maximo) {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const valores = new Uint32Array(1);
    crypto.getRandomValues(valores);
    return valores[0] % maximo;
  }
  return Math.floor(Math.random() * maximo);
}

function elegir(conjunto) {
  return conjunto[aleatorio(conjunto.length)];
}

export function generarClaveTemporal(longitud = 12) {
  const caracteres = [
    elegir(MAYUSCULAS),
    elegir(MINUSCULAS),
    elegir(NUMEROS),
    elegir(SIMBOLOS),
  ];
  while (caracteres.length < longitud) {
    caracteres.push(elegir(TODOS));
  }
  for (let indice = caracteres.length - 1; indice > 0; indice -= 1) {
    const posicion = aleatorio(indice + 1);
    [caracteres[indice], caracteres[posicion]] = [
      caracteres[posicion],
      caracteres[indice],
    ];
  }
  return caracteres.join("");
}
