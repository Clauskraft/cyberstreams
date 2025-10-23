export default async function globalSetup() {
  const jestMatchersSymbol = (Symbol as any).for?.("$$jest-matchers-object");
  if (jestMatchersSymbol && (globalThis as any)[jestMatchersSymbol]) {
    try {
      delete (globalThis as any)[jestMatchersSymbol];
    } catch {
      // ignore
    }
  }
}


