import meta from '@/lib/data/meta.json';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site';

/** JSON-LD do site. `Dataset` e o tipo certo aqui: isto e um benchmark com
 *  artefatos versionados e licenca, nao uma pagina de produto. Vale tanto pro
 *  Google entender que e dado real quanto pro Dataset Search indexar. */
export default function JsonLd() {
  const graph = [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { '@id': `${SITE_URL}/#org` },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#org`,
      name: 'Kodus',
      url: 'https://kodus.io',
      logo: `${SITE_URL}/kodus-logo.webp`,
    },
    {
      '@type': 'Dataset',
      '@id': `${SITE_URL}/#dataset`,
      name: 'CodeReviewBench — AI Code Review Benchmark',
      description: SITE_DESCRIPTION,
      url: `${SITE_URL}/leaderboard`,
      license: 'https://opensource.org/licenses/MIT',
      isAccessibleForFree: true,
      creator: { '@id': `${SITE_URL}/#org` },
      dateModified: meta.generatedAt,
      keywords: [
        'AI code review benchmark',
        'code review benchmark',
        'LLM code review',
        'bug detection recall',
        'static analysis evaluation',
      ],
      variableMeasured: [
        { '@type': 'PropertyValue', name: 'recall', description: `Valid true positives found out of the ${meta.totalGoldens} in the gold set, micro-averaged across all pull requests.` },
        { '@type': 'PropertyValue', name: 'precision', description: 'Published comments matching a valid true positive, out of all published comments; each true positive counts once.' },
        { '@type': 'PropertyValue', name: 'F1', description: 'Harmonic mean of recall and precision.' },
        { '@type': 'PropertyValue', name: 'F2', description: 'F-score with beta = 2, 5PR/(4P+R): recall weighs twice precision. Ranking metric.' },
        { '@type': 'PropertyValue', name: 'costPerBugFound', description: 'Token cost at vendor list price, with prompt cache, divided by true positives found.' },
      ],
      distribution: [
        {
          '@type': 'DataDownload',
          encodingFormat: 'application/json',
          // Apontava pro repo no GitHub, que devolve text/html: quem seguisse o
          // link atras do JSON declarado recebia uma pagina HTML. Agora aponta
          // pro endpoint que serve o dado de verdade.
          contentUrl: `${SITE_URL}/api/leaderboard.json`,
        },
        {
          '@type': 'DataDownload',
          encodingFormat: 'text/html',
          contentUrl: 'https://github.com/kodustech/codereviewbench',
        },
      ],
    },
  ];

  return (
    <script
      type="application/ld+json"
      // Conteudo estatico gerado por nos, sem entrada de usuario.
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }) }}
    />
  );
}
