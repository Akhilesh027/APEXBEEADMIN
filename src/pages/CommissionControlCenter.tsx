import React, { useState } from 'react';
import { Sparkles, AlertCircle, Info } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export const CommissionControlCenter: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'platform' | 'referral' | 'franchise' | 'wishlink' | 'incentives' | 'bonuses'>('platform');

  // Simulator Sliders States
  const [sellingPrice, setSellingPrice] = useState<number>(1000);
  const [platformRate, setPlatformRate] = useState<number>(12); // %
  const [referralPool, setReferralPool] = useState<number>(4); // %
  const [franchisePool, setFranchisePool] = useState<number>(3); // %
  const [wishLinkRate, setWishLinkRate] = useState<number>(2); // %
  const [firstPurchase, setFirstPurchase] = useState<number>(30); // Flat ₹
  const [bonusRate, setBonusRate] = useState<number>(1); // %

  // Calculate live allocations
  const platformCommValue = (platformRate / 100) * sellingPrice;
  
  const referralAlloc = (referralPool / 100) * sellingPrice;
  const franchiseAlloc = (franchisePool / 100) * sellingPrice;
  const wishLinkAlloc = (wishLinkRate / 100) * sellingPrice;
  const bonusAlloc = (bonusRate / 100) * sellingPrice;
  
  const totalPayout = referralAlloc + franchiseAlloc + wishLinkAlloc + bonusAlloc + firstPurchase;
  const netPlatformGain = platformCommValue - totalPayout;
  const sellerEarnings = sellingPrice - platformCommValue;

  const isDeficit = netPlatformGain < 0;

  // Chart data
  const chartData = [
    { name: 'Seller Share', value: sellerEarnings, color: '#10b981' },
    { name: 'Platform Net Profit', value: Math.max(0, netPlatformGain), color: '#6366f1' },
    { name: 'Referral Network', value: referralAlloc, color: '#3b82f6' },
    { name: 'Franchise Network', value: franchiseAlloc, color: '#f59e0b' },
    { name: 'WishLink Partner', value: wishLinkAlloc, color: '#a855f7' },
    { name: 'First Purchase Discount', value: firstPurchase, color: '#ec4899' },
    { name: 'Bonus Pool', value: bonusAlloc, color: '#ef4444' }
  ].filter(d => d.value > 0);

  const getTabHeader = (tab: typeof activeSubTab) => {
    switch (tab) {
      case 'platform': return 'Platform Service Fees';
      case 'referral': return 'Multi-tier Referral Payouts';
      case 'franchise': return 'Franchise Partner Commissions';
      case 'wishlink': return 'Wish Link Content Incentives';
      case 'incentives': return 'First Order Incentives';
      case 'bonuses': return 'Performance Bonus Programs';
      default: return tab;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Submenus Bar */}
      <div className="flex gap-2 flex-wrap bg-card border border-border/60 p-2 rounded-2xl select-none shadow-sm">
        {(['platform', 'referral', 'franchise', 'wishlink', 'incentives', 'bonuses'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeSubTab === tab
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            {getTabHeader(tab)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Simulator inputs and sliders - 7 Columns */}
        <div className="lg:col-span-7 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="border-b border-border pb-3">
            <h3 className="text-sm font-bold text-foreground">Commission Simulator Console</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Simulate splits and adjust values for {getTabHeader(activeSubTab)}</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Input Selling Price */}
            <div className="space-y-1">
              <label className="text-muted-foreground block font-medium">Product Retail Price (MRP/Selling Price)</label>
              <input
                type="number"
                min="1"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full max-w-xs p-2.5 border border-border/80 focus:border-primary rounded-xl bg-secondary/15 text-foreground outline-none font-mono font-bold text-sm"
              />
            </div>

            {/* Slider platformRate */}
            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <div className="flex justify-between font-medium"><span className="text-muted-foreground">Platform Service Fee Rate</span><span className="font-mono text-primary font-bold">{platformRate}%</span></div>
              <input
                type="range" min="3" max="30" step="0.5"
                value={platformRate}
                onChange={(e) => setPlatformRate(Number(e.target.value))}
                className="w-full accent-primary h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Slider referralPool */}
            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <div className="flex justify-between font-medium"><span className="text-muted-foreground">Referral Distribution Pool</span><span className="font-mono text-primary font-bold">{referralPool}%</span></div>
              <input
                type="range" min="0" max="10" step="0.5"
                value={referralPool}
                onChange={(e) => setReferralPool(Number(e.target.value))}
                className="w-full accent-primary h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Slider franchisePool */}
            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <div className="flex justify-between font-medium"><span className="text-muted-foreground">Franchise Pool Rate</span><span className="font-mono text-primary font-bold">{franchisePool}%</span></div>
              <input
                type="range" min="0" max="10" step="0.5"
                value={franchisePool}
                onChange={(e) => setFranchisePool(Number(e.target.value))}
                className="w-full accent-primary h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Slider wishLinkRate */}
            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <div className="flex justify-between font-medium"><span className="text-muted-foreground">Wish Link Creator Incentive</span><span className="font-mono text-primary font-bold">{wishLinkRate}%</span></div>
              <input
                type="range" min="0" max="8" step="0.5"
                value={wishLinkRate}
                onChange={(e) => setWishLinkRate(Number(e.target.value))}
                className="w-full accent-primary h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Slider firstPurchase */}
            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <div className="flex justify-between font-medium"><span className="text-muted-foreground">First Purchase Discount Incentive</span><span className="font-mono text-primary font-bold">₹{firstPurchase}</span></div>
              <input
                type="range" min="0" max="150" step="5"
                value={firstPurchase}
                onChange={(e) => setFirstPurchase(Number(e.target.value))}
                className="w-full accent-primary h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Slider bonusRate */}
            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <div className="flex justify-between font-medium"><span className="text-muted-foreground">Quarterly Performance Bonus Pool</span><span className="font-mono text-primary font-bold">{bonusRate}%</span></div>
              <input
                type="range" min="0" max="5" step="0.5"
                value={bonusRate}
                onChange={(e) => setBonusRate(Number(e.target.value))}
                className="w-full accent-primary h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right: Live simulation distribution preview - 5 Columns */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="border-b border-border pb-3 flex items-center justify-between select-none">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-primary" />
                Distribution Preview
              </h3>
              <span className="text-[10px] text-muted-foreground font-mono">Live calculation</span>
            </div>

            {isDeficit && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl flex gap-1.5 text-[10px] font-semibold animate-bounce select-none">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>Deficit Alert! Payout settings exceed Platform service fees. Gain is negative: -₹{Math.abs(netPlatformGain).toFixed(2)}.</span>
              </div>
            )}

            <div className="h-48 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => `₹${Number(val).toFixed(2)}`}
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                    itemStyle={{ fontSize: 11, color: 'var(--foreground)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Platform Margin</span>
                <span className={`text-base font-mono font-bold ${isDeficit ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {isDeficit ? '-' : ''}₹{Math.abs(netPlatformGain).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 text-xs border-t border-dashed border-border pt-4">
              <div className="flex justify-between border-b border-border/40 pb-1.5">
                <span className="text-muted-foreground">Product Selling Price</span>
                <span className="font-mono font-bold text-foreground">₹{sellingPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-1.5">
                <span className="text-muted-foreground">Platform Service Charge ({platformRate}%)</span>
                <span className="font-mono text-foreground">₹{platformCommValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-1.5">
                <span className="text-muted-foreground">Total Payout Liabilities</span>
                <span className="font-mono text-foreground font-semibold">₹{totalPayout.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-1.5 font-semibold text-emerald-500">
                <span>Seller Store Earnings (Net)</span>
                <span className="font-mono font-bold">₹{sellerEarnings.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between pt-1 font-bold ${isDeficit ? 'text-rose-500' : 'text-primary'}`}>
                <span>Platform Net Profit Margins</span>
                <span className="font-mono">₹{netPlatformGain.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="p-3 bg-secondary/15 rounded-xl border border-border/40 text-[9px] text-muted-foreground flex gap-1">
              <Info size={14} className="text-primary shrink-0 mt-0.5" />
              <span>Platform service fees are deducted from gross seller margins. Payout liabilities represent ecosystem payouts to referral users, state franchises, and WishLink affiliates.</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
