import React, { useState, useEffect } from 'react';
import { ShieldAlert, User, Clock, FileText } from 'lucide-react';
import { subscriptionApi } from '../api/subscriptionApi';

export const SubscriptionAuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await subscriptionApi.getAuditLogs();
      if (res.success) setLogs(res.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">Subscription Administrative Audit Trail</h3>
        <p className="text-xs text-slate-400">Complete historical timeline of every price modification, manual assignment, or entitlement override.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-950/50">
                <th className="p-4">Action</th>
                <th className="p-4">Target Type</th>
                <th className="p-4">Vendor</th>
                <th className="p-4">Reason / Notes</th>
                <th className="p-4">Performed By</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No administrative audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-primary text-xs">{log.action}</td>
                    <td className="p-4 text-xs font-semibold text-slate-300">{log.targetType}</td>
                    <td className="p-4 text-slate-300">{log.vendorId?.businessName || log.vendorId || 'N/A'}</td>
                    <td className="p-4 text-xs text-slate-400 max-w-xs truncate">{log.reason}</td>
                    <td className="p-4 text-xs text-slate-300">{log.performedBy?.email || 'Admin'}</td>
                    <td className="p-4 text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
