import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  Clock,
  UserCheck,
  CheckCircle,
  FileSpreadsheet,
  Search,
  Filter,
  Eye,
  FileText,
  UserPlus,
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

const API_BASE = 'https://server.apexbee.in/api';

export const AcademyLeads: React.FC = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [interestType, setInterestType] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [stateId, setStateId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [mandalId, setMandalId] = useState('');
  const [campaignSource, setCampaignSource] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dropdown lists
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [mandals, setMandals] = useState<any[]>([]);
  const [assignees, setAssignees] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    total: 0,
    new: 0,
    entrepreneur: 0,
    skillDevelopment: 0,
    contacted: 0,
    qualified: 0,
    followUp: 0,
    followUpsDue: 0,
    converted: 0,
  });

  // Modals / Drawer details
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [actionStatus, setActionStatus] = useState('');
  const [actionAssignee, setActionAssignee] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [leadDetailLoading, setLeadDetailLoading] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  // 1. Fetch States on mount
  useEffect(() => {
    fetch(`${API_BASE}/territories/states`, { headers: getHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStates(data.states || []);
      })
      .catch(console.error);
  }, []);

  // 2. Fetch Districts on State change
  useEffect(() => {
    if (!stateId || !stateId.match(/^[0-9a-fA-F]{24}$/)) {
      setDistricts([]);
      return;
    }
    fetch(`${API_BASE}/territories/districts/${stateId}`, { headers: getHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setDistricts(data.districts || []);
      })
      .catch(console.error);
  }, [stateId]);

  // 3. Fetch Mandals on District change
  useEffect(() => {
    if (!districtId || !districtId.match(/^[0-9a-fA-F]{24}$/)) {
      setMandals([]);
      return;
    }
    fetch(`${API_BASE}/territories/mandals/${districtId}`, { headers: getHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setMandals(data.mandals || []);
      })
      .catch(console.error);
  }, [districtId]);

  // 4. Fetch Assignees on mount
  useEffect(() => {
    fetch(`${API_BASE}/admin/academy/assignees`, { headers: getHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAssignees(data.data || []);
      })
      .catch(console.error);
  }, []);

  // 5. Fetch Leads & Stats
  const fetchLeads = () => {
    setLoading(true);
    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      search,
      status,
      interestType,
      assignedTo,
      stateId,
      districtId,
      mandalId,
      campaignSource,
      startDate,
      endDate,
    });

    fetch(`${API_BASE}/admin/academy/leads?${queryParams.toString()}`, { headers: getHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLeads(data.data || []);
          setTotal(data.pagination.total);
          setTotalPages(data.pagination.pages);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchStats = () => {
    const queryParams = new URLSearchParams({
      stateId,
      districtId,
      mandalId,
      assignedTo,
      campaignSource,
      startDate,
      endDate,
    });
    fetch(`${API_BASE}/admin/academy/analytics?${queryParams.toString()}`, { headers: getHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [page, status, interestType, assignedTo, stateId, districtId, mandalId, campaignSource, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  // Open detailed Lead view
  const viewLeadDetails = (lead: any) => {
    setLeadDetailLoading(true);
    setSelectedLead(null);
    setShowDetailModal(true);
    fetch(`${API_BASE}/admin/academy/leads/${lead.leadId}`, { headers: getHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSelectedLead(data.data);
          setActionStatus(data.data.status);
          setActionAssignee(data.data.assignedTo?._id || '');
          setFollowUpDate(data.data.nextFollowUpAt ? data.data.nextFollowUpAt.split('T')[0] : '');
        }
      })
      .catch(console.error)
      .finally(() => setLeadDetailLoading(false));
  };

  const handleUpdateStatus = () => {
    if (!selectedLead) return;
    fetch(`${API_BASE}/admin/academy/leads/${selectedLead.leadId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status: actionStatus, note: actionNotes }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert('Status updated successfully!');
          setActionNotes('');
          viewLeadDetails(selectedLead);
          fetchLeads();
          fetchStats();
        } else {
          alert(data.message || 'Status transition invalid or failed.');
        }
      })
      .catch(console.error);
  };

  const handleAssign = () => {
    if (!selectedLead || !actionAssignee) return;
    fetch(`${API_BASE}/admin/academy/leads/${selectedLead.leadId}/assign`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ assignedTo: actionAssignee }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert('Counselor assigned successfully!');
          viewLeadDetails(selectedLead);
          fetchLeads();
        } else {
          alert(data.message || 'Assignment failed.');
        }
      })
      .catch(console.error);
  };

  const handleScheduleFollowUp = () => {
    if (!selectedLead || !followUpDate) return;
    fetch(`${API_BASE}/admin/academy/leads/${selectedLead.leadId}/follow-up`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ nextFollowUpAt: new Date(followUpDate).toISOString(), note: actionNotes }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert('Follow-up scheduled successfully!');
          setActionNotes('');
          viewLeadDetails(selectedLead);
          fetchLeads();
          fetchStats();
        } else {
          alert(data.message || 'Failed to schedule follow-up.');
        }
      })
      .catch(console.error);
  };

  const handleAddNote = () => {
    if (!selectedLead || !actionNotes) return;
    fetch(`${API_BASE}/admin/academy/leads/${selectedLead.leadId}/notes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ note: actionNotes }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert('Note added successfully!');
          setActionNotes('');
          viewLeadDetails(selectedLead);
        } else {
          alert(data.message || 'Failed to add note.');
        }
      })
      .catch(console.error);
  };

  const handleExportCSV = () => {
    const queryParams = new URLSearchParams({
      status,
      interestType,
      assignedTo,
      stateId,
      districtId,
      mandalId,
      campaignSource,
      startDate,
      endDate,
    });
    window.open(`${API_BASE}/admin/academy/leads/export?${queryParams.toString()}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-amber-400" /> Academy Leads Management
          </h1>
          <p className="text-xs text-slate-400 font-medium">Manage student and entrepreneur interests registrations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={fetchLeads} className="rounded-xl border border-slate-800 text-slate-400 hover:text-white bg-transparent px-3 py-1.5 text-xs font-bold flex items-center">
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </button>
          <button type="button" onClick={handleExportCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl border-none px-3 py-1.5 text-xs font-bold flex items-center">
            <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">Total Leads</div>
            <div className="text-lg font-black text-white">{stats.total}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">New leads</div>
            <div className="text-lg font-black text-white">{stats.new}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">Follow-up Due</div>
            <div className="text-lg font-black text-white">{stats.followUpsDue}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">Contacted</div>
            <div className="text-lg font-black text-white">{stats.contacted}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm col-span-2 md:col-span-1">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">Converted</div>
            <div className="text-lg font-black text-white">{stats.converted}</div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by ID, name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 w-full focus:outline-none focus:border-amber-400"
            />
          </div>
          <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl border-none text-xs font-bold px-4 py-2">
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="follow_up">Follow Up</option>
              <option value="converted">Converted</option>
              <option value="not_interested">Not Interested</option>
              <option value="invalid">Invalid</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400">Program Type</label>
            <select
              value={interestType}
              onChange={(e) => setInterestType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="">All Paths</option>
              <option value="become_entrepreneur">Become Entrepreneur</option>
              <option value="skill_development">Skill Development</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400">Assignee</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="">Unassigned</option>
              {assignees.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name} ({a.roles.join(', ')})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400">State</label>
            <select
              value={stateId}
              onChange={(e) => {
                setStateId(e.target.value);
                setDistrictId('');
                setMandalId('');
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="">All States</option>
              {states.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400">District</label>
            <select
              value={districtId}
              onChange={(e) => {
                setDistrictId(e.target.value);
                setMandalId('');
              }}
              disabled={!stateId}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none disabled:opacity-50"
            >
              <option value="">All Districts</option>
              {districts.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400">Campaign Source</label>
            <input
              type="text"
              value={campaignSource}
              onChange={(e) => setCampaignSource(e.target.value)}
              placeholder="e.g. google, facebook"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none placeholder-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Table view */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <span className="text-xs text-slate-500 font-bold">Loading leads data...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-20 text-center text-slate-500 text-sm font-bold">No leads found matching current criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-extrabold">
                  <th className="p-4">Lead ID</th>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Mobile</th>
                  <th className="p-4">Program Path</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Counselor</th>
                  <th className="p-4">Created At</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {leads.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-950/40 text-slate-200 transition-colors">
                    <td className="p-4 font-mono font-bold text-amber-400">{l.leadId}</td>
                    <td className="p-4 font-bold">{l.fullName}</td>
                    <td className="p-4">{l.mobile}</td>
                    <td className="p-4 font-bold">
                      {l.interestType === 'become_entrepreneur' ? (
                        <span className="text-sky-400">Entrepreneur</span>
                      ) : (
                        <span className="text-violet-400">Skill Dev</span>
                      )}
                    </td>
                    <td className="p-4">
                      {l.districtId?.name || ''}, {l.stateId?.name || ''}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${l.status === 'new'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : l.status === 'contacted'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : l.status === 'qualified'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : l.status === 'follow_up'
                                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                  : l.status === 'converted'
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                    : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-300">{l.assignedTo?.name || 'Unassigned'}</td>
                    <td className="p-4 text-slate-400">{new Date(l.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-center">
                      <button type="button" onClick={() => viewLeadDetails(l)} className="bg-slate-800 hover:bg-slate-750 text-white rounded-xl border-none text-xs font-bold px-3 py-1.5 flex items-center">
                        <Eye className="w-3.5 h-3.5 mr-1" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing page {page} of {totalPages} ({total} total leads)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 rounded-xl text-xs py-1.5 px-3 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 rounded-xl text-xs py-1.5 px-3 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Dialog Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-200 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowDetailModal(false)}
              className="absolute right-4 top-4 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full w-8 h-8 flex items-center justify-center p-0 border-none"
            >
              ✕
            </button>

            {leadDetailLoading || !selectedLead ? (
              <div className="p-20 text-center flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                <span className="text-xs text-slate-500 font-bold">Loading details...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header */}
                <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h2 className="text-xl font-black text-white">{selectedLead.fullName}</h2>
                    <p className="text-xs text-slate-400">
                      ID: <span className="font-mono text-amber-400">{selectedLead.leadId}</span> | Status:{' '}
                      <span className="text-slate-350 capitalize font-bold">{selectedLead.status}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs font-black uppercase bg-slate-950 text-slate-400 px-3 py-1.5 rounded-xl border border-slate-800">
                      {selectedLead.interestType === 'become_entrepreneur' ? 'Incubation' : 'Courses'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left block: Personal & Locations */}
                  <div className="space-y-4 md:col-span-2">
                    <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 space-y-3">
                      <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">Contact & Profile Info</h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-500 font-bold block">Mobile:</span>
                          <span className="font-semibold">{selectedLead.mobile}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-bold block">Email:</span>
                          <span>{selectedLead.email || 'None'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-bold block">State / District:</span>
                          <span>
                            {selectedLead.stateId?.name || ''} / {selectedLead.districtId?.name || ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-bold block">Mandal / Town:</span>
                          <span>{selectedLead.mandalId?.name || selectedLead.city || 'None'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-bold block">Pincode:</span>
                          <span className="font-mono">{selectedLead.pincode || 'None'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-bold block">Consent accepted:</span>
                          <span className="text-green-400 font-bold">Yes (Version {selectedLead.consentVersion})</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 space-y-3">
                      <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">Selected Interests & Answers</h4>
                      <div className="space-y-2.5 text-xs">
                        <div>
                          <span className="text-slate-500 font-bold block mb-1">Selections:</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedLead.selectedInterests?.map((i: string) => (
                              <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-300 font-bold rounded">
                                {i}
                              </span>
                            ))}
                          </div>
                        </div>

                        {selectedLead.interestType === 'become_entrepreneur' ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <span className="text-slate-500 font-bold block">Investment range:</span>
                              <span className="font-bold text-slate-300">{selectedLead.investmentRange || 'Not selected'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 font-bold block">Expected Timeline:</span>
                              <span className="font-bold text-slate-300">{selectedLead.expectedStartTimeline || 'Not selected'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 font-bold block">Owns physical space:</span>
                              <span>{selectedLead.ownBusinessLocation ? 'Yes' : 'No'}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <span className="text-slate-500 font-bold block">Learning Mode:</span>
                              <span className="font-bold text-slate-300">{selectedLead.learningMode || 'Not selected'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 font-bold block">Experience level:</span>
                              <span className="font-bold text-slate-300">{selectedLead.experienceLevel || 'Not selected'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 font-bold block">Requires job support:</span>
                              <span>{selectedLead.jobAssistanceRequired ? 'Yes' : 'No'}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timeline Activity logs */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">Activity History</h4>
                      <div className="max-h-[160px] overflow-y-auto space-y-2 pr-2">
                        {selectedLead.activities?.map((act: any) => (
                          <div key={act._id} className="p-2.5 bg-slate-950/20 border border-slate-850 rounded-xl flex justify-between items-start gap-4 text-[10px]">
                            <div>
                              <span className="font-extrabold capitalize text-slate-300">{act.action.replace('_', ' ')}</span>
                              {act.fromStatus && (
                                <span className="text-slate-500 ml-1.5">
                                  ({act.fromStatus} → {act.toStatus})
                                </span>
                              )}
                              {act.note && <p className="text-slate-400 mt-1 italic">"{act.note}"</p>}
                            </div>
                            <div className="text-right text-slate-500">
                              <span>By: {act.performedBy?.name || 'Self'}</span>
                              <span className="block mt-0.5">{new Date(act.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Block: Admin Controls Form */}
                  <div className="space-y-4">
                    <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-5 space-y-4">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-1.5">
                        <Filter className="w-4 h-4 text-amber-400" /> Actions Panel
                      </h4>

                      {/* Notes / Reason text block */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400">Action Notes / Reason Note</label>
                        <textarea
                          rows={2}
                          className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                          placeholder="Type notes or status transition reason here..."
                          value={actionNotes}
                          onChange={(e) => setActionNotes(e.target.value)}
                        />
                      </div>

                      {/* Status select & button */}
                      <div className="flex flex-col gap-2 border-t border-slate-900 pt-3">
                        <label className="text-[10px] font-bold text-slate-400">Update Status</label>
                        <div className="flex gap-2">
                          <select
                            value={actionStatus}
                            onChange={(e) => setActionStatus(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none flex-1"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="qualified">Qualified</option>
                            <option value="follow_up">Follow Up</option>
                            <option value="converted">Converted</option>
                            <option value="not_interested">Not Interested</option>
                            <option value="invalid">Invalid</option>
                          </select>
                          <button type="button" onClick={handleUpdateStatus} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs px-3 py-2">
                            Apply
                          </button>
                        </div>
                      </div>

                      {/* Counselor assignment */}
                      <div className="flex flex-col gap-2 border-t border-slate-900 pt-3">
                        <label className="text-[10px] font-bold text-slate-400">Assign Counselor</label>
                        <div className="flex gap-2">
                          <select
                            value={actionAssignee}
                            onChange={(e) => setActionAssignee(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none flex-1"
                          >
                            <option value="">Unassigned</option>
                            {assignees.map((a) => (
                              <option key={a._id} value={a._id}>
                                {a.name}
                              </option>
                            ))}
                          </select>
                          <button type="button" onClick={handleAssign} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs px-3 py-2">
                            Assign
                          </button>
                        </div>
                      </div>

                      {/* Schedule Follow up */}
                      <div className="flex flex-col gap-2 border-t border-slate-900 pt-3">
                        <label className="text-[10px] font-bold text-slate-400">Schedule Callback</label>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={followUpDate}
                            onChange={(e) => setFollowUpDate(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none flex-1 font-sans"
                          />
                          <button type="button" onClick={handleScheduleFollowUp} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs px-3 py-2">
                            Schedule
                          </button>
                        </div>
                      </div>

                      {/* Note appending button */}
                      <div className="pt-2">
                        <button type="button" onClick={handleAddNote} className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold py-2 border-none">
                          Add General Note Only
                        </button>
                      </div>
                    </div>

                    {/* Admin notes list */}
                    <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-2xl max-h-[160px] overflow-y-auto space-y-2 pr-1">
                      <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Internal Coordinator Notes</span>
                      {selectedLead.adminNotes?.length === 0 ? (
                        <p className="text-[10px] text-slate-500 italic">No notes added yet.</p>
                      ) : (
                        selectedLead.adminNotes?.map((n: any, idx: number) => (
                          <div key={idx} className="p-2 bg-slate-950/40 rounded-lg text-[10px] space-y-0.5">
                            <p className="text-slate-300">"{n.note}"</p>
                            <div className="flex justify-between text-slate-650 font-medium">
                              <span>By: {n.addedBy?.name || 'Admin'}</span>
                              <span>{new Date(n.addedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default AcademyLeads;
