/**
 * Type definitions for Threats module
 */

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low'
export type ThreatStatus = 'active' | 'mitigated' | 'resolved'

export interface Threat {
  id: string
  name: string
  description: string
  severity: SeverityLevel
  status: ThreatStatus
  source: string
  detectedAt: string
  lastSeen: string
  affectedAssets: string[]
  indicators: string[]
}

export interface ThreatStats {
  total: number
  critical: number
  high: number
  medium: number
  low: number
  active: number
  mitigated: number
  resolved: number
}

export interface ThreatFilter {
  severity: SeverityLevel | 'all'
  status: ThreatStatus | 'all'
  source: string | 'all'
}
