/**
 * Mock data for Dagens Puls (Daily Pulse) module
 * This can be easily replaced with real API calls
 */

import type { PulseItem } from '@types/pulse.types'

export const mockPulseData: PulseItem[] = [
  {
    id: '1',
    title: 'New Ransomware Strain Targeting Healthcare',
    category: 'Ransomware',
    severity: 'critical',
    source: 'Dark Web Forum Alpha',
    timestamp: '2 hours ago',
    description:
      'A new ransomware variant specifically targeting hospital systems has been detected across multiple dark web markets.',
    url: '#'
  },
  {
    id: '2',
    title: 'Major Data Breach: 500K User Records Leaked',
    category: 'Data Leak',
    severity: 'high',
    source: 'Breach Database',
    timestamp: '4 hours ago',
    description: 'Credentials from a major e-commerce platform have surfaced on underground markets.',
    url: '#'
  },
  {
    id: '3',
    title: 'Zero-Day Exploit Being Sold',
    category: 'Exploit',
    severity: 'critical',
    source: 'Exploit Market',
    timestamp: '6 hours ago',
    description: 'A previously unknown vulnerability in common enterprise software is being auctioned.',
    url: '#'
  },
  {
    id: '4',
    title: 'Phishing Campaign Targeting Financial Sector',
    category: 'Phishing',
    severity: 'high',
    source: 'Threat Intelligence Feed',
    timestamp: '8 hours ago',
    description: 'Sophisticated phishing emails mimicking bank communications detected.',
    url: '#'
  },
  {
    id: '5',
    title: 'Botnet Infrastructure Update',
    category: 'Malware',
    severity: 'medium',
    source: 'C2 Tracker',
    timestamp: '12 hours ago',
    description: 'Major botnet has shifted to new command and control servers.',
    url: '#'
  },
  {
    id: '6',
    title: 'Cryptocurrency Scam Network Exposed',
    category: 'Fraud',
    severity: 'medium',
    source: 'Fraud Monitor',
    timestamp: '1 day ago',
    description: 'Large-scale cryptocurrency scam operation identified across multiple platforms.',
    url: '#'
  },
  {
    id: '7',
    title: 'DDoS-for-Hire Service Advertising',
    category: 'DDoS',
    severity: 'high',
    source: 'Underground Service',
    timestamp: '1 day ago',
    description: 'New DDoS service offering high-capacity attacks at competitive prices.',
    url: '#'
  },
  {
    id: '8',
    title: 'Stolen Corporate VPN Credentials',
    category: 'Access',
    severity: 'high',
    source: 'Access Broker',
    timestamp: '2 days ago',
    description: 'VPN access to Fortune 500 companies being sold on criminal forums.',
    url: '#'
  },
  {
    id: '9',
    title: 'Malware Campaign Targeting Mobile Devices',
    category: 'Malware',
    severity: 'medium',
    source: 'Mobile Threat Intel',
    timestamp: '2 days ago',
    description: 'Banking trojan spreading through fake productivity apps.',
    url: '#'
  },
  {
    id: '10',
    title: 'Vulnerability Discussion in Hacker Forums',
    category: 'Intelligence',
    severity: 'low',
    source: 'Forum Monitor',
    timestamp: '3 days ago',
    description: 'Active discussions about potential vulnerabilities in IoT devices.',
    url: '#'
  }
]
