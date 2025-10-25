import { useState, lazy, Suspense } from "react";
import {
  Shield,
  Activity,
  Radio,
  FileText,
  Network,
  Settings,
  Bot,
  Database,
} from "lucide-react";

const HomeContent = lazy(() => import("@modules/HomeContent"));
const ThreatsModule = lazy(() => import("@modules/ThreatsModule"));
const ActivityModule = lazy(() => import("@modules/ActivityModule"));
const SignalStream = lazy(() => import("@modules/SignalStream"));
const ConsolidatedIntelligence = lazy(
  () => import("@modules/ConsolidatedIntelligence")
);
const CyberstreamsAgent = lazy(() => import("@modules/CyberstreamsAgent"));
const AgenticStudio = lazy(() => import("@modules/AgenticStudio"));
const AdminV2Page = lazy(() => import("@modules/AdminV2Page"));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-blue"></div>
  </div>
);

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const invalidPath =
    typeof window !== "undefined" && window.location.pathname !== "/";

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyber-dark to-cyber-darker text-white">
      {/* Header */}
      <header className="border-b border-gray-800 backdrop-blur-xl bg-cyber-dark/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center space-x-3"
              data-testid="cyberstreams-logo"
            >
              <Shield className="w-8 h-8 text-cyber-blue" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyber-blue to-cyber-purple bg-clip-text text-transparent">
                  CYBERSTREAMS
                </h1>
                <p className="text-xs text-gray-400">
                  Dark Web Intelligence Platform
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-400 font-medium">LIVE</span>
              </div>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyber-blue" />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-800 backdrop-blur-xl bg-cyber-dark/30">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-1 overflow-x-auto">
            {[
              { id: "dashboard", label: "Dashboard", icon: Shield },
              { id: "agent", label: "AI Agent", icon: Bot },
              { id: "agentic", label: "OSINT Studio", icon: Settings },
              { id: "threats", label: "Threats", icon: Activity },
              { id: "pulse", label: "Signal Stream", icon: Radio },
              { id: "activity", label: "Activity", icon: FileText },
              { id: "intel", label: "Intelligence", icon: Network },
              { id: "admin", label: "Admin", icon: Database },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`nav-${
                  tab.id === "intel" ? "intelligence" : tab.id
                }`}
                className={`flex items-center space-x-2 px-6 py-3 font-medium transition-all ${
                  activeTab === tab.id
                    ? "border-b-2 border-cyber-blue text-cyber-blue"
                    : "text-gray-400 hover:text-white"
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
      <main className="container mx-auto px-4 py-8">
        {invalidPath ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold">404</h2>
            <p className="text-gray-400">Page not found</p>
          </div>
        ) : (
          <Suspense fallback={<LoadingSpinner />}>
            {activeTab === "dashboard" && <HomeContent />}
            {activeTab === "agent" && <CyberstreamsAgent />}
            {activeTab === "agentic" && <AgenticStudio />}
            {activeTab === "threats" && <ThreatsModule />}
            {activeTab === "pulse" && <SignalStream />}
            {activeTab === "activity" && <ActivityModule />}
            {activeTab === "intel" && <ConsolidatedIntelligence />}
            {activeTab === "admin" && <AdminV2Page />}
          </Suspense>
        )}
      </main>
    </div>
  );
}

export default App;
