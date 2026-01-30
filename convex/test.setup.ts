// Test setup file for convex-test
// This must be in the convex directory to properly glob the function files
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - import.meta.glob is provided by Vite at build time
export const modules = import.meta.glob("./**/*.ts");
