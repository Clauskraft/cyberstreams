import { useState, useEffect } from "react";
import SignalStream from "./SignalStream";
import { TrendingUp, AlertTriangle, Shield, Globe } from "lucide-react";

const HomeContent = () => {
  const [stats, setStats] = useState([
    {
      label: "Active Threats",
      value: "...",
      change: "+0%",
      icon: AlertTriangle,
      iconColor: "text-red-500",
      badgeBg: "bg-red-500/10",
      badgeText: "text-red-400",
    },
    {
      label: "Monitored Sources",
      value: "...",
      change: "+0%",
      icon: Globe,
      iconColor: "text-cyan-400",
      badgeBg: "bg-cyan-500/10",
      badgeText: "text-cyan-400",
    },
    {
      label: "Protected Systems",
      value: "...",
      change: "+0%",
      icon: Shield,
      iconColor: "text-green-500",
      badgeBg: "bg-green-500/10",
      badgeText: "text-green-400",
    },
    {
      label: "Trend Score",
      value: "...",
      change: "+0%",
      icon: TrendingUp,
      iconColor: "text-purple-500",
      badgeBg: "bg-purple-500/10",
      badgeText: "text-purple-400",
    },
  ]);

  const [recentActivity, setRecentActivity] = useState<Array<{
    time: string;
    action: string;
    severity: string;
  }>>([]);

  const [threatCategories, setThreatCategories] = useState<Array<{
    name: string;
    count: number;
    percentage: number;
  }>>([]);

  // Load real stats from API
  useEffect(() => {
    const loadStats = async () => {
      try {
        // Get Intel Scraper stats
        const scraperRes = await fetch('/api/intel-scraper/status');
        const scraperData = scraperRes.ok ? await scraperRes.json() : { success: false };
        
        // Get source count
        const sourcesRes = await fetch('/api/config/sources');
        const sourcesData = sourcesRes.ok ? await sourcesRes.json() : { success: false };
        
        // Get knowledge base stats
        const kbRes = await fetch('/api/knowledge/stats');
        const kbData = kbRes.ok ? await kbRes.json() : { success: false };

        // Get recent activity
        const activityRes = await fetch('/api/dashboard/recent-activity');
        const activityData = activityRes.ok ? await activityRes.json() : { success: false };

        // Get threat categories
        const categoriesRes = await fetch('/api/dashboard/threat-categories');
        const categoriesData = categoriesRes.ok ? await categoriesRes.json() : { success: false };

        if (scraperData.success && sourcesData.success && kbData.success) {
          const totalDocuments = scraperData.data.totalDocumentsProcessed || 0;
          const totalSources = sourcesData.data?.length || 0;
          const totalKnowledge = kbData.data?.totalDocuments || 0;
          
          setStats([
            {
              label: "Intelligence Reports",
              value: totalDocuments.toString(),
              change: "+12%",
              icon: AlertTriangle,
              iconColor: "text-red-500",
              badgeBg: "bg-red-500/10",
              badgeText: "text-red-400",
            },
            {
              label: "Monitored Sources",
              value: totalSources.toString(),
              change: "+5%",
              icon: Globe,
              iconColor: "text-cyan-400",
              badgeBg: "bg-cyan-500/10",
              badgeText: "text-cyan-400",
            },
            {
              label: "Knowledge Documents",
              value: totalKnowledge.toString(),
              change: "+8%",
              icon: Shield,
              iconColor: "text-green-500",
              badgeBg: "bg-green-500/10",
              badgeText: "text-green-400",
            },
            {
              label: "Success Rate",
              value: (scraperData.data.successRate || 0) + "%",
              change: "+2%",
              icon: TrendingUp,
              iconColor: "text-purple-500",
              badgeBg: "bg-purple-500/10",
              badgeText: "text-purple-400",
            },
          ]);
        }

        if (activityData.success) {
          setRecentActivity(activityData.data);
        }

        if (categoriesData.success) {
          setThreatCategories(categoriesData.data);
        }
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div
        data-testid="dashboard-stats"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`w-8 h-8 ${stat.iconColor}`} />
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${stat.badgeBg} ${stat.badgeText}`}
              >
                {stat.change}
              </span>
            </div>
            <p className="text-3xl font-bold mb-1 text-white">{stat.value}</p>
            <p className="text-sm text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* SignalStream - Differentiated intelligence lane */}
      {/* <SignalStream /> */}

      {/* Additional Dashboard Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Threat Categories</h3>
          <div className="space-y-3">
            {threatCategories.length === 0 ? (
              <p className="text-sm text-gray-400">No category data available</p>
            ) : (
              threatCategories.map((category, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">{category.name}</span>
                    <span className="text-sm font-medium">{category.count}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-cyber-blue h-2 rounded-full transition-all"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-400">No recent activity</p>
            ) : (
              recentActivity.map((activity, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activity.severity === "high"
                        ? "bg-red-500"
                        : activity.severity === "medium"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeContent;
