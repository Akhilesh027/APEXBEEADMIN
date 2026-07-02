import React from 'react';
import { LineChart as LineChartIcon, TrendingUp, Sparkles, Store, Award, MapPin, Layers, Info } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';

export const BusinessIntelligence: React.FC = () => {

  // Revenue Forecast Mock Data
  const forecastData = [
    { month: 'Jan', revenue: 12.0, forecast: 12.0 },
    { month: 'Feb', revenue: 13.5, forecast: 13.5 },
    { month: 'Mar', revenue: 15.0, forecast: 15.0 },
    { month: 'Apr', revenue: 17.5, forecast: 17.5 },
    { month: 'May', revenue: 19.0, forecast: 19.0 },
    { month: 'Jun', revenue: 21.0, forecast: 21.0 },
    // Forecast Period
    { month: 'Jul', revenue: null, forecast: 23.5 },
    { month: 'Aug', revenue: null, forecast: 26.2 },
    { month: 'Sep', revenue: null, forecast: 28.5 },
    { month: 'Oct', revenue: null, forecast: 31.8 }
  ];

  // Growth Forecast Mock Data
  const growthForecastData = [
    { month: 'Jun', users: 4850, forecast: 4850 },
    { month: 'Jul', users: null, forecast: 5500 },
    { month: 'Aug', users: null, forecast: 6200 },
    { month: 'Sep', users: null, forecast: 7100 },
    { month: 'Oct', users: null, forecast: 8000 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card border border-border/80 rounded-2xl p-4 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Business Intelligence</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Ecosystem data analytics, trends, forecasting, and leaderboards</p>
        </div>
        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 dark:text-amber-400 text-xs font-bold rounded-xl border border-amber-500/20 select-none animate-pulse">
          Coming Soon
        </span>
      </div>
      {/* Top rankings metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 select-none">
        
        {/* Top Vendor */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Top Vendor</span>
          <span className="text-xs font-bold text-foreground truncate mt-1 block">Krishna Electronics</span>
          <span className="text-[10px] text-emerald-500 font-mono font-semibold block mt-1">₹4.2L Sales</span>
          <Store className="text-primary shrink-0 self-end mt-2" size={16} />
        </div>

        {/* Top Wholesaler */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Top Wholesaler</span>
          <span className="text-xs font-bold text-foreground truncate mt-1 block">Sahyadri Agri Dist</span>
          <span className="text-[10px] text-emerald-500 font-mono font-semibold block mt-1">₹1.8L Trade</span>
          <Store className="text-amber-500 shrink-0 self-end mt-2" size={16} />
        </div>

        {/* Top Entrepreneur */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Top Entrepreneur</span>
          <span className="text-xs font-bold text-foreground truncate mt-1 block">Ramesh Kulkarni</span>
          <span className="text-[10px] text-emerald-500 font-mono font-semibold block mt-1">₹48k Earned</span>
          <Award className="text-violet-500 shrink-0 self-end mt-2" size={16} />
        </div>

        {/* Top Franchise */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Top Franchise</span>
          <span className="text-xs font-bold text-foreground truncate mt-1 block">Pune District</span>
          <span className="text-[10px] text-emerald-500 font-mono font-semibold block mt-1">₹12.4L GMV</span>
          <Award className="text-indigo-500 shrink-0 self-end mt-2" size={16} />
        </div>

        {/* Top City */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Top City</span>
          <span className="text-xs font-bold text-foreground truncate mt-1 block">Pune, MH</span>
          <span className="text-[10px] text-emerald-500 font-mono font-semibold block mt-1">+78% Growth</span>
          <MapPin className="text-rose-500 shrink-0 self-end mt-2" size={16} />
        </div>

        {/* Top Category */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Top Category</span>
          <span className="text-xs font-bold text-foreground truncate mt-1 block">Electronics</span>
          <span className="text-[10px] text-emerald-500 font-mono font-semibold block mt-1">38% Share</span>
          <Layers className="text-emerald-500 shrink-0 self-end mt-2" size={16} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Forecast chart */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <LineChartIcon size={14} className="text-primary" />
              Ecosystem Revenue Forecast
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Dashed line indicates forecasted revenue (in Lakhs ₹)</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.1)" />
                <XAxis dataKey="month" stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                  itemStyle={{ fontSize: 11, color: 'var(--foreground)' }}
                />
                <Line type="monotone" dataKey="revenue" name="Actual Revenue" stroke="#6366f1" strokeWidth={3.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="forecast" name="Forecast Model" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Forecast chart */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={14} className="text-primary" />
              Customer Base Growth Forecast
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Forecast of registered buyers curve</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthForecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.1)" />
                <XAxis dataKey="month" stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                  itemStyle={{ fontSize: 11, color: 'var(--foreground)' }}
                />
                <Area type="monotone" dataKey="forecast" name="User Growth Forecast" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorForecast)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Business Insights Panel */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3 select-none">
          <Sparkles className="text-primary shrink-0 animate-pulse" size={18} />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Predictive Business Insights</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          {/* Insight 1 */}
          <div className="bg-secondary/15 p-4 rounded-xl border border-border/40 space-y-2 relative overflow-hidden">
            <span className="text-[9px] font-bold text-primary uppercase font-mono tracking-wider block">Procurement Alert</span>
            <p className="font-semibold text-foreground">Agri-Seeds Wholesaler Shortage</p>
            <p className="text-muted-foreground text-[10px] leading-relaxed">
              Agri seeds demand is peaking in Pune district. Suggest onboarding 3 new local wholesalers to avoid stock-out delays during sowing season.
            </p>
          </div>

          {/* Insight 2 */}
          <div className="bg-secondary/15 p-4 rounded-xl border border-border/40 space-y-2 relative overflow-hidden">
            <span className="text-[9px] font-bold text-violet-500 uppercase font-mono tracking-wider block">Territory Operations</span>
            <p className="font-semibold text-foreground">Entrepreneur Density Dip</p>
            <p className="text-muted-foreground text-[10px] leading-relaxed">
              Mandal entrepreneur density in Central zone has dropped below normal threshold. Suggest releasing a localized training incentive push.
            </p>
          </div>

          {/* Insight 3 */}
          <div className="bg-secondary/15 p-4 rounded-xl border border-border/40 space-y-2 relative overflow-hidden">
            <span className="text-[9px] font-bold text-amber-500 uppercase font-mono tracking-wider block">Margin Optimizer</span>
            <p className="font-semibold text-foreground">Platform Fee Optimization</p>
            <p className="text-muted-foreground text-[10px] leading-relaxed">
              Category commission fees for Fashion apparel can be raised by 0.5% in West Zone without affecting overall vendor onboarding velocity.
            </p>
          </div>
        </div>

        <div className="p-3 bg-indigo-500/5 border border-indigo-500/15 rounded-xl text-[9px] text-muted-foreground flex gap-1.5 items-center select-none">
          <Info size={14} className="text-primary shrink-0" />
          <span>Insights are synthesized using linear regression analytics of regional sales volume and merchant density indexes.</span>
        </div>
      </div>

    </div>
  );
};
