import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // `md`/`mdx` entram como extensoes de pagina pra que os posts em
  // src/content/blog possam ser importados como componente pelo /blog/[slug].
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
};

// Sem remark-frontmatter o bloco `---` do topo do .mdx nao e reconhecido como
// frontmatter: o markdown le os tres tracos como <hr> e despeja title/description/
// date/keywords no corpo do artigo como texto. O gray-matter (que le os metadados
// no servidor) nao ajuda aqui — quem precisa ignorar o bloco e o compilador MDX.
// O plugin vai como STRING, nao como funcao importada: o loader de MDX exige
// options serializaveis (Turbopack passa a config entre processos) e uma funcao
// quebra o build com "does not have serializable options".
const withMDX = createMDX({
  options: {
    remarkPlugins: [
      ["remark-frontmatter", { type: "yaml", marker: "-" }],
      // Tabela em markdown e GFM, nao CommonMark: sem este plugin o bloco de
      // pipes sai como paragrafo de texto cru e os componentes table/th/td do
      // mdx-components.tsx nunca sao chamados.
      "remark-gfm",
    ],
  },
});

export default withMDX(nextConfig);
