// naive-ui ships this internal module's types as `index.cssr.d.ts`, which TypeScript doesn't pair with `.mjs`.
declare module "naive-ui/es/_styles/global/index.cssr.mjs" {
  const preflight: { render(): string };
  export default preflight;
}
