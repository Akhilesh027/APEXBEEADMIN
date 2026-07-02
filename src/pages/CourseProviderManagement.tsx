import React, { useState } from 'react';
import { GraduationCap, Users, BookOpen, Award, Search, Play } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const CourseProviderManagement: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'providers' | 'courses' | 'certifications' | 'revenue' | 'enrollments' | 'analytics'>('courses');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample course listings
  const coursesList = [
    { id: 'CRS-01', title: 'Rural Micro-Enterprise Basics', provider: 'ApexBee L&D Center', instructor: 'Dr. Ramesh Patil', students: 120, revenue: 24000, status: 'Active' },
    { id: 'CRS-02', title: 'Agritech Fertilizer Operations', provider: 'Sahyadri Agri Distributors', instructor: 'Anil Rao', students: 95, revenue: 18000, status: 'Active' },
    { id: 'CRS-03', title: 'Digital Payment Setup for Shops', provider: 'ApexBee Fintech Team', instructor: 'Suresh Shah', students: 240, revenue: 0, status: 'Active' },
    { id: 'CRS-04', title: 'Customer Retention & Marketing', provider: 'Creative Marketing Partners', instructor: 'Priya Verma', students: 60, revenue: 12000, status: 'Pending Review' }
  ];

  const getFilteredCourses = () => {
    switch (activeSubTab) {
      case 'providers':
        return coursesList.filter(c => c.provider.includes('ApexBee') || c.provider.includes('Partners'));
      default:
        return coursesList;
    }
  };

  const currentCourses = getFilteredCourses().filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const enrollmentData = [
    { month: 'Jan', count: 320 },
    { month: 'Feb', count: 450 },
    { month: 'Mar', count: 580 },
    { month: 'Apr', count: 490 },
    { month: 'May', count: 680 },
    { month: 'Jun', count: 810 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Providers</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">12 Providers</span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">+2 certified this month</span>
          </div>
          <GraduationCap className="text-primary shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Active Courses</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">42 Programs</span>
            <span className="text-[9px] text-violet-500 mt-1 block font-semibold">120 video modules ready</span>
          </div>
          <BookOpen className="text-violet-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Students</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">810 Enrolled</span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">+22% growth MoM</span>
          </div>
          <Users className="text-emerald-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Revenue Generated</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">₹54,000</span>
            <span className="text-[9px] text-muted-foreground mt-1 block">Split evenly with external providers</span>
          </div>
          <Award className="text-amber-500 shrink-0" size={24} />
        </div>
      </div>

      {/* Subtab Menu */}
      <div className="flex gap-2 flex-wrap bg-card border border-border/60 p-2 rounded-2xl select-none shadow-sm">
        {(['providers', 'courses', 'certifications', 'revenue', 'enrollments', 'analytics'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeSubTab === tab
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            {tab === 'revenue' ? 'Revenue Sharing' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Data tables */}
        <div className="lg:col-span-8 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border/60">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Ecosystem Digital Academy ({activeSubTab.toUpperCase()})
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
                <input
                  type="text"
                  placeholder="Search course title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-secondary/50 border border-border/80 focus:border-primary rounded-xl text-xs outline-none w-full sm:w-48 font-medium"
                />
              </div>
              <button 
                onClick={() => alert('Exporting enrollments spreadsheets...')}
                className="px-3.5 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-xl border border-border/60 transition-all shadow-sm"
              >
                Export
              </button>
            </div>
          </div>

          {activeSubTab === 'revenue' ? (
            /* Revenue sharing data */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">Course Title</th>
                    <th className="p-3 font-semibold text-muted-foreground">Provider</th>
                    <th className="p-3 font-semibold text-muted-foreground">Total Sales</th>
                    <th className="p-3 font-semibold text-muted-foreground">Provider share (60%)</th>
                    <th className="p-3 font-semibold text-muted-foreground">Platform retained (40%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {coursesList.map(c => (
                    <tr key={c.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3 font-medium text-foreground">{c.title}</td>
                      <td className="p-3 text-muted-foreground">{c.provider}</td>
                      <td className="p-3 font-mono text-muted-foreground">₹{c.revenue.toLocaleString()}</td>
                      <td className="p-3 font-mono font-semibold text-emerald-500">₹{(c.revenue * 0.6).toLocaleString()}</td>
                      <td className="p-3 font-mono font-semibold text-primary">₹{(c.revenue * 0.4).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeSubTab === 'certifications' ? (
            /* Certifications status */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">Course ID</th>
                    <th className="p-3 font-semibold text-muted-foreground">Certificate Title</th>
                    <th className="p-3 font-semibold text-muted-foreground">Requirements</th>
                    <th className="p-3 font-semibold text-muted-foreground">Passing Grade</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  <tr className="hover:bg-secondary/10">
                    <td className="p-3 font-mono font-semibold text-primary">CRS-01</td>
                    <td className="p-3 font-medium text-foreground">Rural Micro-Enterprise Certified Operator</td>
                    <td className="p-3 text-muted-foreground">Complete 5 modules + Passing Final Exam</td>
                    <td className="p-3 font-mono text-muted-foreground">80% Score</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-500">Active</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-secondary/10">
                    <td className="p-3 font-mono font-semibold text-primary">CRS-02</td>
                    <td className="p-3 font-medium text-foreground">Agritech Fertilizer Professional Handler</td>
                    <td className="p-3 text-muted-foreground">Complete modules + Video submission</td>
                    <td className="p-3 font-mono text-muted-foreground">85% Score</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-500">Active</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            /* Default: Course Lists / Providers directory */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">Course Title</th>
                    <th className="p-3 font-semibold text-muted-foreground">ID</th>
                    <th className="p-3 font-semibold text-muted-foreground">Provider / Instructor</th>
                    <th className="p-3 font-semibold text-muted-foreground">Enrollments</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {currentCourses.map(c => (
                    <tr key={c.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3">
                        <span className="font-semibold text-foreground block">{c.title}</span>
                        <span className="text-[10px] text-muted-foreground block">Provider: {c.provider}</span>
                      </td>
                      <td className="p-3 font-mono text-muted-foreground">{c.id}</td>
                      <td className="p-3 text-muted-foreground">{c.instructor}</td>
                      <td className="p-3 font-mono text-muted-foreground">{c.students} students</td>
                      <td className="p-3 text-center border-l border-border/10">
                        {c.status.includes('Pending') ? (
                          <button 
                            onClick={() => alert(`Approving course publication: ${c.title}`)}
                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold transition-all"
                          >
                            Approve Course
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1">
                            <Play size={12} className="text-emerald-500 fill-emerald-500" /> Live
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Enrollment Analytics Area chart */}
        <div className="lg:col-span-4 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Student Registrations</span>
            <p className="text-[9px] text-muted-foreground mt-0.5">Monthly course enrolment statistics</p>
          </div>
          
          <div className="h-44 w-full select-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={enrollmentData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.1)" />
                <XAxis dataKey="month" stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                  itemStyle={{ fontSize: 11, color: 'var(--foreground)' }}
                />
                <Area type="monotone" dataKey="count" name="Enrolled Students" stroke="#10b981" fill="rgba(16, 185, 129, 0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
