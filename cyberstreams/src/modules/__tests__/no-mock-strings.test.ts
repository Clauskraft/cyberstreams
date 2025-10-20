import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const filesToCheck = [
  path.join(__dirname, '..', 'ActivityModule.tsx'),
  path.join(__dirname, '..', 'ThreatsModule.tsx'),
  path.join(__dirname, '..', 'ConsolidatedIntelligence.tsx'),
  path.join(__dirname, '..', 'HomeContent.tsx'),
]

const banned = [
  'Mock data',
  'mock data',
  'mockThreatsData',
  'mockPulseData',
  'DagensPuls_OLD'
]

describe('No mock/demo strings present', () => {
  for (const file of filesToCheck) {
    it(`file ${path.basename(file)} does not contain mock strings`, () => {
      const content = fs.readFileSync(file, 'utf-8')
      for (const token of banned) {
        expect(content.includes(token)).toBe(false)
      }
    })
  }
})
