/**
 * Type definitions for security findings and intelligence
 */

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type FindingCategory =
  | 'vulnerability'
  | 'malware'
  | 'breach'
  | 'reconnaissance'
  | 'lateral-movement'
  | 'privilege-escalation'
  | 'exfiltration'
  | 'command-control'

export interface Finding {
  id: string
  title: string
  description: string
  category: FindingCategory
  severity: FindingSeverity
  source: string
  discoveredAt: string
  affectedSystems: string[]
  remediation?: string
  references?: string[]
}

export interface FindingsStats {
  total: number
  critical: number
  high: number
  medium: number
  low: number
  info: number
}

export interface FindingFilter {
  severity: FindingSeverity | 'all'
  category: FindingCategory | 'all'
  source: string | 'all'
}
