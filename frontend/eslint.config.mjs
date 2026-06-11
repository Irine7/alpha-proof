import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  {
    ignores: [".next/**", "next-env.d.ts", "tsconfig.tsbuildinfo"]
  }
];

export default eslintConfig;
