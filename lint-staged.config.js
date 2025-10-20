module.exports = {
  // Run type checking on TypeScript files
  '*.{ts,tsx}': () => 'tsc --noEmit',

  // Lint and format JavaScript/TypeScript files
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],

  // Format JSON, YAML, Markdown files
  '*.{json,yml,yaml,md}': ['prettier --write'],

  // Format CSS files
  '*.css': ['prettier --write'],
}
