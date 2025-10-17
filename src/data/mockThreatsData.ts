/**
 * Mock data for Threats module
 * This can be easily replaced with real API calls
 */

import type { Threat } from '@types/threat.types'

export const mockThreatsData: Threat[] = [
  {
    id: 'THR-001',
    name: 'Advanced Persistent Threat (APT) Campaign',
    description: 'Sophisticated multi-stage attack targeting financial institutions',
    severity: 'critical',
    status: 'active',
    source: 'Threat Intelligence Platform',
    detectedAt: '2024-10-15T09:30:00Z',
    lastSeen: '2024-10-18T14:22:00Z',
    affectedAssets: ['PROD-DB-01', 'PROD-WEB-02', 'PROD-API-03'],
    indicators: ['192.168.1.100', 'malware.exe', 'c2.example.com']
  },
  {
    id: 'THR-002',
    name: 'Ransomware Infection',
    description: 'LockBit ransomware detected on production servers',
    severity: 'critical',
    status: 'active',
    source: 'EDR System',
    detectedAt: '2024-10-16T11:15:00Z',
    lastSeen: '2024-10-18T13:45:00Z',
    affectedAssets: ['FILE-SERVER-01', 'FILE-SERVER-02'],
    indicators: ['*.encrypted', 'README.txt', 'ransom.exe']
  },
  {
    id: 'THR-003',
    name: 'SQL Injection Vulnerability',
    description: 'Unpatched SQL injection in legacy web application',
    severity: 'high',
    status: 'mitigated',
    source: 'Vulnerability Scanner',
    detectedAt: '2024-10-10T08:20:00Z',
    lastSeen: '2024-10-17T16:30:00Z',
    affectedAssets: ['LEGACY-APP-01'],
    indicators: ['SQL patterns', 'injection attempts']
  },
  {
    id: 'THR-004',
    name: 'Credential Harvesting',
    description: 'Phishing emails harvesting employee credentials',
    severity: 'high',
    status: 'active',
    source: 'Email Security Gateway',
    detectedAt: '2024-10-14T10:00:00Z',
    lastSeen: '2024-10-18T12:15:00Z',
    affectedAssets: ['EMAIL-GATEWAY', 'USER-WORKSTATIONS'],
    indicators: ['phishing.com', 'fake-login.html', 'credential stealer']
  },
  {
    id: 'THR-005',
    name: 'Privilege Escalation',
    description: 'Local privilege escalation vulnerability in Windows',
    severity: 'medium',
    status: 'resolved',
    source: 'Patch Management',
    detectedAt: '2024-09-20T14:30:00Z',
    lastSeen: '2024-10-15T09:00:00Z',
    affectedAssets: ['WORKSTATION-GROUP-A'],
    indicators: ['CVE-2024-XXXXX', 'elevation.exe']
  },
  {
    id: 'THR-006',
    name: 'Botnet Communication',
    description: 'Infected workstations communicating with known botnet C2',
    severity: 'high',
    status: 'active',
    source: 'Network IDS',
    detectedAt: '2024-10-16T15:45:00Z',
    lastSeen: '2024-10-18T11:30:00Z',
    affectedAssets: ['WORKSTATION-05', 'WORKSTATION-12'],
    indicators: ['185.220.101.0/24', 'malware.c2.net', 'suspicious domains']
  }
]
