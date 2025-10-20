import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

import ActivityModule from '../ActivityModule'
import ThreatsModule from '../ThreatsModule'
import ConsolidatedIntelligence from '../ConsolidatedIntelligence'
import HomeContent from '../HomeContent'

describe('NoData smoke rendering', () => {
  it('ActivityModule shows NoData', () => {
    render(<ActivityModule />)
    expect(screen.getByText('Ingen data')).toBeInTheDocument()
  })

  it('ThreatsModule shows NoData', () => {
    render(<ThreatsModule />)
    expect(screen.getByText('Ingen data')).toBeInTheDocument()
  })

  it('ConsolidatedIntelligence shows NoData', () => {
    render(<ConsolidatedIntelligence />)
    expect(screen.getByText('Ingen data')).toBeInTheDocument()
  })

  it('HomeContent shows NoData', () => {
    render(<HomeContent />)
    expect(screen.getByText('Ingen data')).toBeInTheDocument()
  })
})
