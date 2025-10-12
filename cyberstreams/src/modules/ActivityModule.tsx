import { useState, useEffect } from 'react'
import {
  Activity, Clock, User, Database,
  AlertTriangle, CheckCircle, XCircle, Info
} from 'lucide-react'

interface ActivityLog {
  id: string
  timestamp: string
  type: 'scan' | 'alert' | 'threat' | 'system' | 'user' | 'data'
  severity: 'info' | 'warning' | 'error' | 'success'
  user: string
  action: string
  details: string
  metadata?: {
    affectedSystems?: number
    duration?: string
    result?: string
  }
}

const ActivityModule = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    // Mock activity data
    const mockActivities: ActivityLog[] = [
      {
        id: 'ACT-001',
        timestamp: '2 minutes ago',
        type: 'alert',
        severity: 'error',
        user: 'System',
        action: 'Critical Threat Detected',
        details: 'Ransomware activity detected on healthcare network segment',
        metadata: { affectedSystems: 12, result: 'Quarantined' }
      },
      {
        id: 'ACT-002',
        timestamp: '15 minutes ago',
        type: 'scan',
        severity: 'success',
        user: 'AutoScanner',
        action: 'Network Scan Completed',
        details: 'Full network vulnerability scan finished successfully',
        metadata: { affectedSystems: 234, duration: '45 minutes' }
      },
      {
        id: 'ACT-003',
        timestamp: '32 minutes ago',
        type: 'user',
        severity: 'info',
        user: 'admin@cyberstreams.dk',
        action: 'User Login',
        details: 'Administrator logged in from secure workstation',
      },
      {
        id: 'ACT-004',
        timestamp: '1 hour ago',
        type: 'threat',
        severity: 'warning',
        user: 'ThreatHunter',
        action: 'Suspicious Activity Flagged',
        details: 'Unusual outbound traffic pattern detected on server cluster',
        metadata: { affectedSystems: 5 }
      },
      {
        id: 'ACT-005',
        timestamp: '1 hour ago',
        type: 'data',
        severity: 'success',
        user: 'DataSync',
        action: 'Threat Intelligence Updated',
        details: 'Latest IOCs and threat signatures synchronized',
        metadata: { result: '1,456 new indicators' }
      },
      {
        id: 'ACT-006',
        timestamp: '2 hours ago',
        type: 'system',
        severity: 'info',
        user: 'System',
        action: 'Backup Completed',
        details: 'Automated system backup completed successfully',
        metadata: { duration: '23 minutes' }
      },
      {
        id: 'ACT-007',
        timestamp: '3 hours ago',
        type: 'alert',
        severity: 'warning',
        user: 'IDS',
        action: 'Intrusion Attempt Blocked',
        details: 'Multiple failed authentication attempts from external IP',
        metadata: { result: 'IP Blacklisted' }
      },
      {
        id: 'ACT-008',
        timestamp: '4 hours ago',
        type: 'scan',
        severity: 'success',
        user: 'WebCrawler',
        action: 'Dark Web Scan Completed',
        details: 'Routine dark web monitoring scan finished',
        metadata: { result: '23 new mentions found' }
      },
      {
        id: 'ACT-009',
        timestamp: '5 hours ago',
        type: 'user',
        severity: 'info',
        user: 'analyst@cyberstreams.dk',
        action: 'Report Generated',
        details: 'Weekly threat intelligence report created',
      },
      {
        id: 'ACT-010',
        timestamp: '6 hours ago',
        type: 'threat',
        severity: 'error',
        user: 'ThreatDetector',
        action: 'Malware Detected',
        details: 'Malicious file identified in email attachment',
        metadata: { affectedSystems: 1, result: 'Quarantined' }
      },
      {
        id: 'ACT-011',
        timestamp: '8 hours ago',
        type: 'system',
        severity: 'success',
        user: 'System',
        action: 'System Update Applied',
        details: 'Security patches and updates installed successfully',
      },
      {
        id: 'ACT-012',
        timestamp: '10 hours ago',
        type: 'alert',
        severity: 'warning',
        user: 'AlertEngine',
        action: 'Threshold Exceeded',
        details: 'Network bandwidth utilization exceeded 80% threshold',
      },
      {
        id: 'ACT-013',
        timestamp: '12 hours ago',
        type: 'data',
        severity: 'success',
        user: 'DataProcessor',
        action: 'Data Processing Complete',
        details: 'Daily threat data processing and analysis completed',
        metadata: { duration: '2 hours', result: '5.2GB processed' }
      },
      {
        id: 'ACT-014',
        timestamp: '1 day ago',
        type: 'scan',
        severity: 'success',
        user: 'ComplianceScanner',
        action: 'Compliance Audit Passed',
        details: 'Monthly security compliance check completed successfully',
      },
      {
        id: 'ACT-015',
        timestamp: '1 day ago',
        type: 'user',
        severity: 'info',
        user: 'security@cyberstreams.dk',
        action: 'Policy Updated',
        details: 'Security policy configuration modified',
      },
      {
        id: 'ACT-016',
        timestamp: '1 day ago',
        type: 'threat',
        severity: 'error',
        user: 'ThreatIntel',
        action: 'New Threat Campaign Identified',
        details: 'Coordinated phishing campaign detected across multiple vectors',
        metadata: { affectedSystems: 34 }
      },
      {
        id: 'ACT-017',
        timestamp: '2 days ago',
        type: 'system',
        severity: 'info',
        user: 'System',
        action: 'Maintenance Window Scheduled',
        details: 'System maintenance scheduled for next weekend',
      },
      {
        id: 'ACT-018',
        timestamp: '2 days ago',
        type: 'alert',
        severity: 'success',
        user: 'Firewall',
        action: 'Attack Mitigated',
        details: 'DDoS attack successfully blocked by firewall',
        metadata: { result: 'Zero impact' }
      },
      {
        id: 'ACT-019',
        timestamp: '3 days ago',
        type: 'data',
        severity: 'success',
        user: 'ArchiveSystem',
        action: 'Data Archived',
        details: 'Historical threat data archived to long-term storage',
        metadata: { result: '145GB archived' }
      },
      {
        id: 'ACT-020',
        timestamp: '3 days ago',
        type: 'scan',
        severity: 'success',
        user: 'VulnScanner',
        action: 'Vulnerability Assessment Complete',
        details: 'Quarterly vulnerability assessment completed',
        metadata: { result: '3 critical issues found' }
      }
    ]

    setTimeout(() => {
      setActivities(mockActivities)
      setLoading(false)
    }, 600)
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'bg-red-500/10 border-red-500/30 text-red-400'
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
      case 'success': return 'bg-green-500/10 border-green-500/30 text-green-400'
      default: return 'bg-blue-500/10 border-blue-500/30 text-blue-400'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return XCircle
      case 'warning': return AlertTriangle
      case 'success': return CheckCircle
      default: return Info
    }
  }

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(a => a.type === filter)

  const stats = {
    total: activities.length,
    errors: activities.filter(a => a.severity === 'error').length,
    warnings: activities.filter(a => a.severity === 'warning').length,
    success: activities.filter(a => a.severity === 'success').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-blue"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Activities</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Errors</p>
              <p className="text-2xl font-bold text-red-400">{stats.errors}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Warnings</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.warnings}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Success</p>
              <p className="text-2xl font-bold text-green-400">{stats.success}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <div className="flex gap-2 flex-wrap">
          {['all', 'alert', 'threat', 'scan', 'system', 'user', 'data'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg capitalize transition-all ${
                filter === type
                  ? 'bg-cyber-blue text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-gray-900 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold">Activity Timeline</h2>
          <p className="text-sm text-gray-400">Real-time system activity log</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {filteredActivities.map((activity) => {
              const SeverityIcon = getSeverityIcon(activity.severity)

              return (
                <div
                  key={activity.id}
                  className="flex gap-4 pb-4 border-b border-gray-800 last:border-0 hover:bg-gray-800/50 p-4 rounded-lg transition-all"
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center ${getSeverityColor(activity.severity)}`}>
                    <SeverityIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{activity.action}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400 capitalize">
                          {activity.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{activity.timestamp}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{activity.details}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {activity.user}
                      </span>
                      {activity.metadata?.affectedSystems && (
                        <span className="flex items-center gap-1">
                          <Database className="w-3 h-3" />
                          {activity.metadata.affectedSystems} systems
                        </span>
                      )}
                      {activity.metadata?.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {activity.metadata.duration}
                        </span>
                      )}
                      {activity.metadata?.result && (
                        <span className="text-cyber-blue">
                          {activity.metadata.result}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {filteredActivities.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No activities found for this filter</p>
        </div>
      )}
    </div>
  )
}

export default ActivityModule
