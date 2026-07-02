import React, { useState } from 'react';
import { BookOpen, Play, Award, Users, Search, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const TrainingManagement: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'programs' | 'library' | 'assessments' | 'certifications' | 'progress'>('programs');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample training programs
  const programsList = [
    { id: 'TRN-101', title: 'ApexBee Ecosystem Onboarding', target: 'Entrepreneurs, Wholesalers', modulesCount: 8, completions: 340, passingRate: '95%', status: 'Active' },
    { id: 'TRN-102', title: 'Rural Micro-Enterprise Scaling', target: 'Entrepreneurs', modulesCount: 5, completions: 180, passingRate: '92%', status: 'Active' },
    { id: 'TRN-103', title: 'Customer Support and SLA Ethics', target: 'Customer Support Staff', modulesCount: 4, completions: 62, passingRate: '98%', status: 'Active' },
    { id: 'TRN-104', title: 'Agri Retail Store Operations', target: 'Vendors', modulesCount: 6, completions: 0, passingRate: 'N/A', status: 'Pending Review' }
  ];

  const getFilteredPrograms = () => {
    switch (activeSubTab) {
      case 'programs':
        return programsList;
      default:
        return programsList;
    }
  };

  const currentPrograms = getFilteredPrograms().filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.target.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const learningTrend = [
    { month: 'Jan', completions: 45 },
    { month: 'Feb', completions: 68 },
    { month: 'Mar', completions: 80 },
    { month: 'Apr', completions: 72 },
    { month: 'May', completions: 98 },
    { month: 'Jun', completions: 140 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Training Programs</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">15 Programs</span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">+2 programs certified</span>
          </div>
          <BookOpen className="text-primary shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Video Library</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">120 Modules</span>
            <span className="text-[9px] text-violet-500 mt-1 block font-semibold">Uptime stream SLA: 99.9%</span>
          </div>
          <Play className="text-violet-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Completions</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">582 Learners</span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">+18% growth MoM</span>
          </div>
          <Users className="text-emerald-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Passing Rate</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">94.5%</span>
            <span className="text-[9px] text-muted-foreground mt-1 block">Average scores on assessments</span>
          </div>
          <Award className="text-amber-500 shrink-0" size={24} />
        </div>
      </div>

      {/* Subtab Menu */}
      <div className="flex gap-2 flex-wrap bg-card border border-border/60 p-2 rounded-2xl select-none shadow-sm">
        {(['programs', 'library', 'assessments', 'certifications', 'progress'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeSubTab === tab
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            {tab === 'programs' ? 'Training Programs' : tab === 'library' ? 'Video Library' : tab === 'assessments' ? 'Assessments' : tab === 'certifications' ? 'Certifications' : 'Learning Progress'}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Data tables */}
        <div className="lg:col-span-8 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border/60">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              L&D Training Programs ({activeSubTab.toUpperCase()})
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
                <input
                  type="text"
                  placeholder="Search program..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-secondary/50 border border-border/80 focus:border-primary rounded-xl text-xs outline-none w-full sm:w-48 font-medium"
                />
              </div>
              <button 
                onClick={() => alert('Exporting completions reports...')}
                className="px-3.5 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-xl border border-border/60 transition-all shadow-sm"
              >
                Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-secondary/40 select-none border-b border-border/60">
                <tr>
                  <th className="p-3 font-semibold text-muted-foreground">Program Title</th>
                  <th className="p-3 font-semibold text-muted-foreground">Target Audience</th>
                  <th className="p-3 font-semibold text-muted-foreground">Length</th>
                  <th className="p-3 font-semibold text-muted-foreground">Completions</th>
                  <th className="p-3 font-semibold text-muted-foreground text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {currentPrograms.map(p => (
                  <tr key={p.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="p-3">
                      <span className="font-semibold text-foreground block">{p.title}</span>
                      <span className="text-[10px] text-muted-foreground block">ID: {p.id} • Passing: {p.passingRate}</span>
                    </td>
                    <td className="p-3 text-muted-foreground">{p.target}</td>
                    <td className="p-3 font-mono text-muted-foreground">{p.modulesCount} modules</td>
                    <td className="p-3 font-mono font-bold text-foreground">{p.completions} learners</td>
                    <td className="p-3 text-center border-l border-border/10">
                      {p.status.includes('Pending') ? (
                        <button 
                          onClick={() => alert(`Approving training program publication: ${p.title}`)}
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold transition-all"
                        >
                          Approve Program
                        </button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1">
                          <CheckCircle size={12} className="text-emerald-500" /> Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Learning Analytics Area chart */}
        <div className="lg:col-span-4 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Completion Rates</span>
            <p className="text-[9px] text-muted-foreground mt-0.5">Monthly certifications granted</p>
          </div>
          
          <div className="h-44 w-full select-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={learningTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.1)" />
                <XAxis dataKey="month" stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                  itemStyle={{ fontSize: 11, color: 'var(--foreground)' }}
                />
                <Area type="monotone" dataKey="completions" name="Learners" stroke="#f59e0b" fill="rgba(245, 158, 11, 0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
