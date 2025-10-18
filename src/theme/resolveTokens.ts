// A tiny resolver for {path.to.token} references inside JSON maps.
// Not production-grade but perfect for demo & theming flow.  See
// README for details on how tokens, semantic aliases and component
// mappings are structured.

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

function flatten(obj: any, prefix = ''): Record<string, any> {
  return Object.keys(obj).reduce((acc, k) => {
    const key = prefix ? `${prefix}.${k}` : k
    if (obj[k] && typeof obj[k] === 'object' && 'value' in obj[k]) {
      acc[key] = obj[k].value
    } else if (obj[k] && typeof obj[k] === 'object') {
      Object.assign(acc, flatten(obj[k], key))
    }
    return acc
  }, {} as Record<string, any>)
}

function resolveRefs(input: any, dict: Record<string, any>): any {
  if (typeof input === 'string') {
    const m = input.match(/^\{(.+?)\}$/)
    if (m) return dict[m[1]] ?? input
    return input
  }
  if (Array.isArray(input)) return input.map(v => resolveRefs(v, dict))
  if (input && typeof input === 'object') {
    const out: any = Array.isArray(input) ? [] : {}
    for (const k of Object.keys(input)) out[k] = resolveRefs(input[k], dict)
    return out
  }
  return input
}

export function resolveTheme(tokens: any, semantic: any, components: any) {
  const tokensFlat = flatten(tokens)
  const semanticResolved = resolveRefs(semantic, tokensFlat)
  const semanticFlat = flatten(semanticResolved)
  const componentsResolved = resolveRefs(components, { ...tokensFlat, ...semanticFlat })
  // Expose a merged theme tree for easy access in components
  return { ...deepClone(tokens), semantic: semanticResolved, components: componentsResolved, color: tokens.color, space: tokens.space, radius: tokens.radius, shadow: tokens.shadow }
}