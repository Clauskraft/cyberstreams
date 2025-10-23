/**
 * Type definitions for Dagens Puls (Daily Pulse) module
 */

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low'

export interface PulseItem {
  id: string
  title: string
  category: string
  severity: SeverityLevel
  source: string
  timestamp: string
  description: string
  url?: string
}

export interface PulseCategory {
  name: string
  count: number
  color: string
}

export interface PulseStats {
  total: number
  critical: number
  high: number
  medium: number
  low: number
}

export interface PulseFilter {
  severity: SeverityLevel | 'all'
  category: string | 'all'
}
