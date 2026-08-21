/**
 * Helpers de slug de par — SEM importar dado.
 *
 * Existe separado de `@/lib/compare` de proposito: aquele modulo importa
 * samples.json (1,3 MB) no topo, entao qualquer componente `'use client'` que
 * importasse `pairSlug` de la arrastava o dataset inteiro pro bundle do
 * cliente. Aconteceu de verdade — o CompareClient gerou um chunk de 1,3 MB.
 * Client component importa DAQUI; quem roda no servidor pode usar os dois.
 */

/** Nenhum slug de modelo contem `-vs-` (verificado 2026-08-21), entao ele nao
 *  colide como separador. */
export const PAIR_SEPARATOR = '-vs-';

/** Ordem canonica: alfabetica por slug, NAO por ranking — ranking muda quando
 *  entra modelo novo e a URL viraria redirect pra todo link ja publicado. */
export function canonicalPair(slugA: string, slugB: string): [string, string] {
    return slugA < slugB ? [slugA, slugB] : [slugB, slugA];
}

export function pairSlug(slugA: string, slugB: string): string {
    const [a, b] = canonicalPair(slugA, slugB);
    return `${a}${PAIR_SEPARATOR}${b}`;
}
