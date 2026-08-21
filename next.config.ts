import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // `md`/`mdx` entram como extensoes de pagina pra que os posts em
  // src/content/blog possam ser importados como componente pelo /blog/[slug].
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
