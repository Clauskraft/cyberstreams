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
  <div className="tdc-flex-center py-20">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tdc-primary-digital-blue"></div>
  </div>
)

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="min-h-screen bg-gradient-to-b from-tdc-primary-dark-blue to-tdc-primary-digital-blue text-white">
      {/* Header */}
      <header className="tdc-nav">
        <div className="tdc-container">
          <div className="tdc-flex-between">
            <div className="tdc-flex">
              <Shield className="w-8 h-8 text-white" />
              <div>
                <h1 className="tdc-heading-2 text-white">
                  CYBERSTREAMS
                </h1>
                <p className="tdc-body-small text-white/80">Dark Web Intelligence Platform</p>
              </div>
            </div>
            <div className="tdc-flex">
              <div className="tdc-status-success">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
                LIVE
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white/10 backdrop-blur-xl">
        <div className="tdc-container">
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
                className={`tdc-nav-item ${
                  activeTab === tab.id ? 'active' : ''
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
      <main className="tdc-container tdc-p-lg">
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
