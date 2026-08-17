import { redirect } from 'next/navigation';

// A explorer per-PR completa (diff, resposta do modelo, veredito por finding)
// dependia de dado que o bench novo não guarda nesse formato — o scorecard só
// tem contagens agregadas, não qual finding específico bateu com qual golden.
// O detalhe por PR que temos hoje (findings brutos + goldens perdidos,
// classificados) já está em /model/[id]. Reintroduzir esta página exige
// instrumentar o scorer pra persistir veredito por finding.
export default function TracesPage() {
  redirect('/leaderboard');
}
