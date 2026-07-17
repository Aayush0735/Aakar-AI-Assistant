// Type declaration for Vite's ?inline CSS imports
// This tells TypeScript that importing a .css file with ?inline
// returns a string containing the raw CSS text
declare module "*.css?inline" {
  const css: string;
  export default css;
}
