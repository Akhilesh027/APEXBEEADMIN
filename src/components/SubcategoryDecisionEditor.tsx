import { useEffect, useState } from 'react';

type Decision = { subcategoryName: string; status: string; reason?: string };
function DecisionRow({ name, saved, disabled, onSave }: { name: string; saved?: Decision; disabled: boolean; onSave: (value: Decision) => Promise<void> }) {
  const [status, setStatus] = useState(saved?.status || 'pending');
  const [reason, setReason] = useState(saved?.reason || '');
  useEffect(() => { setStatus(saved?.status || 'pending'); setReason(saved?.reason || ''); }, [saved?.status, saved?.reason]);
  const requiresReason = ['changes_requested', 'rejected'].includes(status);
  return <div className="rounded-xl border border-border bg-card p-4 space-y-3">
    <p className="font-semibold text-sm">{name}</p>
    <label className="block text-xs">Decision<select aria-label={`Decision for ${name}`} disabled={disabled} value={status} onChange={event => setStatus(event.target.value)} className="block w-full mt-1 rounded-lg border border-border bg-card p-2 text-sm">
      <option value="pending">Pending review</option><option value="approved">Approved for verification</option><option value="changes_requested">Changes requested</option><option value="rejected">Rejected</option>
    </select></label>
    <label className="block text-xs">Reason {requiresReason ? '(required)' : '(optional)'}<textarea aria-label={`Reason for ${name}`} disabled={disabled} value={reason} maxLength={2000} onChange={event => setReason(event.target.value)} rows={2} className="block w-full mt-1 rounded-lg border border-border bg-card p-2 text-sm" /></label>
    <button type="button" disabled={disabled || (requiresReason && reason.trim().length < 5)} onClick={() => onSave({ subcategoryName: name, status, reason })} className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 disabled:opacity-50">Save decision</button>
  </div>;
}

export function SubcategoryDecisionEditor({ names, decisions = [], disabled, onSave }: { names: string[]; decisions?: Decision[]; disabled: boolean; onSave: (value: Decision) => Promise<void> }) {
  return <section className="p-4 border-t border-border space-y-3">
    <h4 className="font-bold text-sm">Subcategory review</h4>
    <p className="text-xs text-muted-foreground">Save a decision for each business. Continue with initial approval to send approved selections for document verification. Pending, correction and rejected selections remain inactive.</p>
    <div className="grid sm:grid-cols-2 gap-3">{names.map(name => <DecisionRow key={name} name={name} saved={decisions.find(item => item.subcategoryName === name)} disabled={disabled} onSave={onSave} />)}</div>
  </section>;
}
