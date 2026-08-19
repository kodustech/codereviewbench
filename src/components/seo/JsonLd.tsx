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
        { '@type': 'PropertyValue', name: 'recall', description: 'Share of human-reported golden bugs the model found, micro-averaged across all pull requests.' },
        { '@type': 'PropertyValue', name: 'precision', description: 'Share of the reported findings that matched a golden bug, micro-averaged.' },
        { '@type': 'PropertyValue', name: 'F1', description: 'Harmonic mean of recall and precision.' },
        { '@type': 'PropertyValue', name: 'costPerBugFound', description: 'Measured API cost divided by golden bugs found.' },
      ],
      distribution: [
        {
          '@type': 'DataDownload',
          encodingFormat: 'application/json',
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
