import { useState, lazy, Suspense } from 'react'
import { Shield, Activity, Radio, FileText, Network, Settings, Bot, Database } from 'lucide-react'

const HomeContent = lazy(() => import('@modules/HomeContent'))
const ThreatsModule = lazy(() => import('@modules/ThreatsModule'))
const ActivityModule = lazy(() => import('@modules/ActivityModule'))
const SignalStream = lazy(() => import('@modules/SignalStream'))
const ConsolidatedIntelligence = lazy(() => import('@modules/ConsolidatedIntelligence'))
const CyberstreamsAgent = lazy(() => import('@modules/CyberstreamsAgent'))
const AdminPage = lazy(() => import('./pages/Admin'))
const AdminV2Page = lazy(() => import('@modules/AdminV2Page'))

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
)

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-600 text-white">
      {/* Header */}
      <header className="bg-blue-600 text-white py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  CYBERSTREAMS
                </h1>
                <p className="text-sm text-white/80">Dark Web Intelligence Platform</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2 inline-block" />
                LIVE
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white/10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-1 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Shield },
              { id: 'agent', label: 'Agent', icon: Bot },
              { id: 'threats', label: 'Threats', icon: Activity },
              { id: 'pulse', label: 'SignalStream', icon: Radio },
              { id: 'activity', label: 'Activity', icon: FileText },
              { id: 'intel', label: 'Consolidated Intel', icon: Network },
              { id: 'admin', label: 'Admin', icon: Settings },
              { id: 'admin-v2', label: 'Admin v2', icon: Database },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white border-b-2 border-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
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
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Suspense fallback={<LoadingSpinner />}>
          {activeTab === 'dashboard' && <HomeContent />}
          {activeTab === 'agent' && <CyberstreamsAgent />}
          {activeTab === 'threats' && <ThreatsModule />}
          {activeTab === 'pulse' && <SignalStream />}
          {activeTab === 'activity' && <ActivityModule />}
          {activeTab === 'intel' && <ConsolidatedIntelligence />}
          {activeTab === 'admin' && <AdminPage />}
          {activeTab === 'admin-v2' && <AdminV2Page />}
        </Suspense>
      </main>
    </div>
  )
}

export default App
