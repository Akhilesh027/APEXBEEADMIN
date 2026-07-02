import React, { useState } from 'react';
import { useAdminState } from '../context/AdminStateContext';
import { Send, CheckCircle2, Clock, Users, Megaphone, Target, Info } from 'lucide-react';

export const CommunicationCenter: React.FC = () => {
  const { addActivityLog } = useAdminState();
  const [activeSubTab, setActiveSubTab] = useState<'push' | 'sms' | 'whatsapp' | 'email' | 'announcements'>('push');

  // Campaign Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState<string[]>(['Customers']);
  const [successMsg, setSuccessMsg] = useState('');

  // Mock campaign history
  const [campaignHistory, setCampaignHistory] = useState<any[]>([
    { title: 'Monsoon Fertilizer Offer', channel: 'WhatsApp Broadcasts', targets: 'Vendors, Wholesalers', date: '2026-06-12 09:30', status: 'Delivered (480 messages)' },
    { title: 'Urgent KYC Verification Reminder', channel: 'SMS Campaigns', targets: 'Entrepreneurs', date: '2026-06-11 14:15', status: 'Delivered (120 messages)' },
    { title: 'Platform Security Policy Upgrade', channel: 'Email Campaigns', targets: 'All Partners', date: '2026-06-10 10:00', status: 'Delivered (1,240 emails)' }
  ]);

  const handleTargetChange = (audience: string) => {
    setTargetAudience(prev =>
      prev.includes(audience) ? prev.filter(t => t !== audience) : [...prev, audience]
    );
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert('Please fill out campaign title and message.');
      return;
    }
    if (targetAudience.length === 0) {
      alert('Please select at least one target audience.');
      return;
    }

    const channelMap: Record<string, string> = {
      push: 'Push Notifications',
      sms: 'SMS Campaigns',
      whatsapp: 'WhatsApp Broadcasts',
      email: 'Email Campaigns',
      announcements: 'Announcements Board'
    };

    const targetStr = targetAudience.join(', ');
    addActivityLog(
      'Campaign Broadcasted',
      `Sent ${channelMap[activeSubTab]} "${title}" to target audience: ${targetStr}.`,
      'info'
    );

    setSuccessMsg(`Campaign "${title}" successfully broadcasted via ${channelMap[activeSubTab]}!`);
    
    // Append to history
    setCampaignHistory(prev => [
      {
        title,
        channel: channelMap[activeSubTab],
        targets: targetStr,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'Delivered (Simulated Broadcast)'
      },
      ...prev
    ]);

    // Reset Form
    setTitle('');
    setMessage('');
    setTargetAudience(['Customers']);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const getChannelLabel = (tab: typeof activeSubTab) => {
    switch (tab) {
      case 'push': return 'Push Notification Builder';
      case 'sms': return 'SMS Campaign Builder';
      case 'whatsapp': return 'WhatsApp Broadcast Builder';
      case 'email': return 'Email Campaign Console';
      case 'announcements': return 'Announcement Board Draft';
      default: return tab;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Submenus Bar */}
      <div className="flex gap-2 flex-wrap bg-card border border-border/60 p-2 rounded-2xl select-none shadow-sm">
        {(['push', 'sms', 'whatsapp', 'email', 'announcements'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveSubTab(tab);
              setSuccessMsg('');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeSubTab === tab
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            {tab === 'push' ? 'Push Alerts' : tab === 'sms' ? 'SMS Campaigns' : tab === 'whatsapp' ? 'WhatsApp Broadcasts' : tab === 'email' ? 'Email campaigns' : 'Public Announcements'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Campaign drafting board - 7 Columns */}
        <div className="lg:col-span-7 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3 select-none">
            <Megaphone className="text-primary shrink-0" size={18} />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{getChannelLabel(activeSubTab)}</h3>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl flex items-center gap-2 text-xs font-semibold select-none animate-fadeIn">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-muted-foreground block font-medium">Campaign Title / Header</label>
              <input
                type="text"
                placeholder="e.g. Weekly Procurement Bonus Promo, System Maintenance Alert"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 border border-border/80 focus:border-primary rounded-xl bg-secondary/15 text-foreground outline-none font-semibold text-sm"
                required
              />
            </div>

            {/* Message Body */}
            <div className="space-y-1">
              <label className="text-muted-foreground block font-medium">Message Body Content</label>
              <textarea
                placeholder="Compose your promotional blast message or platform announcement..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full p-2.5 border border-border/80 focus:border-primary rounded-xl bg-secondary/15 text-foreground outline-none resize-none font-sans"
                required
              />
            </div>

            {/* Target Audience selection */}
            <div className="space-y-2 pt-2 border-t border-border/40 select-none">
              <label className="text-muted-foreground block font-medium flex items-center gap-1">
                <Target size={14} className="text-indigo-500" /> Target Audience Segment
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs font-semibold text-foreground">
                {['Customers', 'Vendors', 'Wholesalers', 'Entrepreneurs', 'Franchises'].map(segment => {
                  const isChecked = targetAudience.includes(segment);
                  return (
                    <label key={segment} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-secondary/20 border-border/60 hover:bg-secondary/40'
                    }`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTargetChange(segment)}
                        className="rounded border-border text-primary outline-none focus:ring-0 shrink-0"
                      />
                      {segment}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Broadcast action button */}
            <button
              type="submit"
              className="w-full py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-1.5 mt-2"
            >
              <Send size={16} /> Broadcast Ecosystem Campaign
            </button>
          </form>
        </div>

        {/* Right: History board - 5 Columns */}
        <div className="lg:col-span-5 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b border-border pb-3 flex items-center justify-between select-none">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} className="text-primary" />
              Ecosystem Broadcast History
            </h3>
            <span className="text-[9px] text-muted-foreground">Historical Blasts</span>
          </div>

          <div className="divide-y divide-border/60 max-h-96 overflow-y-auto no-scrollbar pr-1">
            {campaignHistory.map((item, idx) => (
              <div key={idx} className="py-3 first:pt-0 last:pb-0 text-xs space-y-1">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-foreground block truncate max-w-[190px]">{item.title}</span>
                  <span className="px-2 py-0.5 bg-secondary text-foreground text-[8px] font-bold rounded-md uppercase shrink-0">
                    {item.channel.split(' ')[0]}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-[9px] text-muted-foreground select-none">
                  <span className="flex items-center gap-1 truncate max-w-[150px]"><Users size={10} /> {item.targets}</span>
                  <span>{item.date}</span>
                </div>
                
                <span className="text-[9px] text-emerald-500 font-medium block select-none">
                  Status: {item.status}
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-secondary/15 rounded-xl border border-border/40 text-[9px] text-muted-foreground flex gap-1">
            <Info size={14} className="text-primary shrink-0 mt-0.5" />
            <span>Campaign logs compile SMS routing channels, push payload deliveries, and WhatsApp Business API gateways logs.</span>
          </div>
        </div>

      </div>

    </div>
  );
};
