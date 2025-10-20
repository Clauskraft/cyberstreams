import { useState, lazy, Suspense } from 'react'
import { Shield, Activity, Radio, FileText, Network, Settings, Bot, Search } from 'lucide-react'

const HomeContent = lazy(() => import('@modules/HomeContent'))
const ThreatsModule = lazy(() => import('@modules/ThreatsModule'))
const ActivityModule = lazy(() => import('@modules/ActivityModule'))
const SignalStream = lazy(() => import('@modules/SignalStream'))
const ConsolidatedIntelligence = lazy(() => import('@modules/ConsolidatedIntelligence'))
const CyberstreamsAgent = lazy(() => import('@modules/CyberstreamsAgent'))
const OsintLab = lazy(() => import('@modules/OsintLab'))
const AdminPage = lazy(() => import('./pages/Admin'))

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-blue"></div>
  </div>
)

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyber-dark to-cyber-darker text-white">
      {/* Header */}
      <header className="border-b border-gray-800 backdrop-blur-xl bg-cyber-dark/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-cyber-blue" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyber-blue to-cyber-purple bg-clip-text text-transparent">
                  CYBERSTREAMS
                </h1>
                <p className="text-xs text-gray-400">Dark Web Intelligence Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-400 font-medium">LIVE</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-800 backdrop-blur-xl bg-cyber-dark/30">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-1 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Shield },
              { id: 'agent', label: 'Agent', icon: Bot },
              { id: 'threats', label: 'Threats', icon: Activity },
              { id: 'pulse', label: 'SignalStream', icon: Radio },
              { id: 'activity', label: 'Activity', icon: FileText },
              { id: 'intel', label: 'Consolidated Intel', icon: Network },
              { id: 'osint', label: 'OsintLab', icon: Search },
              { id: 'admin', label: 'Admin', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 font-medium transition-all ${
                  activeTab === tab.id
                    ? 'border-b-2 border-cyber-blue text-cyber-blue'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-20">
        <Suspense fallback={<LoadingSpinner />}>
          {activeTab === 'dashboard' && <HomeContent />}
          {activeTab === 'agent' && <CyberstreamsAgent />}
          {activeTab === 'threats' && <ThreatsModule />}
          {activeTab === 'pulse' && <SignalStream />}
          {activeTab === 'activity' && <ActivityModule />}
          {activeTab === 'intel' && <ConsolidatedIntelligence />}
          {activeTab === 'osint' && <OsintLab />}
          {activeTab === 'admin' && <AdminPage />}
        </Suspense>
      </main>

      {/* Footer - Version Info */}
      <footer className="fixed bottom-4 right-4 z-40">
        <div className="bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-lg px-4 py-2 shadow-lg">
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyber-blue rounded-full animate-pulse" />
              <span className="text-gray-400">Version</span>
              <span className="font-mono text-cyber-blue font-semibold">1.4.0</span>
            </div>
            <div className="w-px h-4 bg-gray-700" />
            <div className="text-gray-500">
              Released: <span className="text-gray-400">2025-10-19</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
