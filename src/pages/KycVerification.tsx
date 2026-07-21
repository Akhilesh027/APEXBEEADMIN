import React, { useState, useEffect } from 'react';
import { ShieldCheck, XCircle, AlertCircle, CheckCircle, Search, Eye, AlertOctagon, Plus, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface IBankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  accountType: string;
  isDefault: boolean;
}

export interface IVendorDocument {
  id: string;
  name: string;
  status: 'Approved' | 'Pending' | 'Rejected' | 'Not Uploaded';
  uploadDate?: string;
  fileName?: string;
  url?: string;
}

export interface IVendor {
  _id: string;
  userId: string;
  businessName: string;
  ownerName: string;
  mobile: string;
  email: string;
  address: string;
  pincode: string;
  gstNumber?: string;
  panNumber?: string;
  status: string;
  bankAccounts: IBankAccount[];
  documents: IVendorDocument[];
  createdAt: string;
}

export const KycVerification: React.FC = () => {
  const [vendors, setVendors] = useState<IVendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<IVendor | null>(null);
  const [filter, setFilter] = useState<'All' | 'Pending KYC' | 'Approved' | 'Suspended'>('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState<'vendor' | 'service_provider'>('vendor');

  // Document Zoom State
  const [zoomDoc, setZoomDoc] = useState<{ title: string; url: string } | null>(null);

  // Custom Comment State
  const [commentText, setCommentText] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [newDocRequestName, setNewDocRequestName] = useState('');

  const mapSpToVendor = (spKyc: any): IVendor => {
    const profile = spKyc.profile || {};

    // Create documents list from fields
    const documents: IVendorDocument[] = [
      { id: 'aadhaarFront', name: 'Aadhaar Card Front', status: spKyc.aadhaarFront ? (spKyc.verificationStatus === 'Approved' ? 'Approved' : spKyc.verificationStatus === 'Rejected' ? 'Rejected' : 'Pending') : 'Not Uploaded', url: spKyc.aadhaarFront, fileName: spKyc.aadhaarFront ? 'aadhaar_front.pdf' : undefined },
      { id: 'aadhaarBack', name: 'Aadhaar Card Back', status: spKyc.aadhaarBack ? (spKyc.verificationStatus === 'Approved' ? 'Approved' : spKyc.verificationStatus === 'Rejected' ? 'Rejected' : 'Pending') : 'Not Uploaded', url: spKyc.aadhaarBack, fileName: spKyc.aadhaarBack ? 'aadhaar_back.pdf' : undefined },
      { id: 'panCard', name: 'PAN Card', status: spKyc.panCard ? (spKyc.verificationStatus === 'Approved' ? 'Approved' : spKyc.verificationStatus === 'Rejected' ? 'Rejected' : 'Pending') : 'Not Uploaded', url: spKyc.panCard, fileName: spKyc.panCard ? 'pan_card.pdf' : undefined },
      { id: 'bankProof', name: 'Bank Passbook / Cancelled Cheque', status: spKyc.bankProof ? (spKyc.verificationStatus === 'Approved' ? 'Approved' : spKyc.verificationStatus === 'Rejected' ? 'Rejected' : 'Pending') : 'Not Uploaded', url: spKyc.bankProof, fileName: spKyc.bankProof ? 'bank_proof.pdf' : undefined },
    ];
    if (spKyc.professionalCertificate) {
      documents.push({ id: 'professionalCertificate', name: 'Professional Certificate', status: spKyc.verificationStatus === 'Approved' ? 'Approved' : spKyc.verificationStatus === 'Rejected' ? 'Rejected' : 'Pending', url: spKyc.professionalCertificate, fileName: 'professional_certificate.pdf' });
    }
    if (spKyc.gstCertificate) {
      documents.push({ id: 'gstCertificate', name: 'GST Certificate', status: spKyc.verificationStatus === 'Approved' ? 'Approved' : spKyc.verificationStatus === 'Rejected' ? 'Rejected' : 'Pending', url: spKyc.gstCertificate, fileName: 'gst_certificate.pdf' });
    }
    if (spKyc.businessRegistration) {
      documents.push({ id: 'businessRegistration', name: 'Business Registration', status: spKyc.verificationStatus === 'Approved' ? 'Approved' : spKyc.verificationStatus === 'Rejected' ? 'Rejected' : 'Pending', url: spKyc.businessRegistration, fileName: 'business_registration.pdf' });
    }

    const bankAccounts: IBankAccount[] = [];
    if (profile.bankDetails && profile.bankDetails.accountNumber) {
      bankAccounts.push({
        id: 'bank-sp',
        accountName: profile.bankDetails.accountHolderName || profile.ownerName,
        accountNumber: profile.bankDetails.accountNumber,
        bankName: profile.bankDetails.bankName,
        ifscCode: profile.bankDetails.ifsc,
        accountType: 'Current/Savings',
        isDefault: true
      });
    }

    return {
      _id: spKyc._id,
      userId: spKyc.providerId,
      businessName: profile.businessName || 'Service Provider',
      ownerName: profile.ownerName || '—',
      mobile: profile.mobile || '—',
      email: profile.email || '—',
      address: `${profile.address || ''} ${profile.village || ''} ${profile.mandal || ''} ${profile.district || ''} ${profile.state || ''}`.trim() || '—',
      pincode: profile.pincode || '—',
      gstNumber: profile.gstNumber || 'N/A',
      panNumber: profile.panNumber || 'N/A',
      status: spKyc.verificationStatus === 'Approved' ? 'active' : spKyc.verificationStatus === 'Rejected' ? 'suspended' : 'pending',
      bankAccounts,
      documents,
      createdAt: spKyc.createdAt || spKyc.submittedAt || ''
    };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (entityType === 'vendor') {
        const res = await fetch('https://server.apexbee.in/api/admin/vendors', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (data.vendors) {
            setVendors(data.vendors);
            if (selectedVendor) {
              const updated = data.vendors.find((v: IVendor) => v.userId === selectedVendor.userId);
              if (updated) setSelectedVendor(updated);
            }
          }
        }
      } else {
        const res = await fetch('https://server.apexbee.in/api/admin/service-providers/kyc', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (data.kycs) {
            const sps = data.kycs.map((spKyc: any) => mapSpToVendor(spKyc));
            setVendors(sps);
            if (selectedVendor) {
              const updated = sps.find((v: IVendor) => v.userId === selectedVendor.userId);
              if (updated) setSelectedVendor(updated);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching KYC data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setSelectedVendor(null);
  }, [entityType]);

  const handleUpdateDocStatus = async (vendorUserId: string, docId: string, status: 'Approved' | 'Rejected') => {
    try {
      const token = localStorage.getItem('adminToken');
      const routeType = entityType === 'vendor' ? 'vendors' : 'service-providers';
      const res = await fetch(`https://server.apexbee.in/api/admin/${routeType}/${vendorUserId}/documents/${docId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const data = await res.json();
        const updatedVendor = entityType === 'vendor' ? data.vendor : mapSpToVendor(data.kyc);
        setVendors(prev => prev.map(v => v.userId === vendorUserId ? updatedVendor : v));
        if (selectedVendor && selectedVendor.userId === vendorUserId) {
          setSelectedVendor(updatedVendor);
        }
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to update document status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestCustomDoc = async (vendorUserId: string) => {
    if (!newDocRequestName.trim()) return;
    try {
      const token = localStorage.getItem('adminToken');
      const routeType = entityType === 'vendor' ? 'vendors' : 'service-providers';
      const res = await fetch(`https://server.apexbee.in/api/admin/${routeType}/${vendorUserId}/request-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newDocRequestName })
      });
      if (res.ok) {
        const data = await res.json();
        const updatedVendor = entityType === 'vendor' ? data.vendor : mapSpToVendor(data.kyc);
        setVendors(prev => prev.map(v => v.userId === vendorUserId ? updatedVendor : v));
        if (selectedVendor && selectedVendor.userId === vendorUserId) {
          setSelectedVendor(updatedVendor);
        }
        setNewDocRequestName('');
        alert('Additional document requested successfully!');
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to request document');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateVendorStatus = async (vendorUserId: string, status: string, remarks?: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (entityType === 'vendor') {
        const res = await fetch(`https://server.apexbee.in/api/admin/vendors/${vendorUserId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status, remarks })
        });
        if (res.ok) {
          const data = await res.json();
          setVendors(prev => prev.map(v => v.userId === vendorUserId ? data.vendor : v));
          if (selectedVendor && selectedVendor.userId === vendorUserId) {
            setSelectedVendor(data.vendor);
          }
          alert(`Vendor status updated to: ${status}`);
        } else {
          const err = await res.json();
          alert(err.message || 'Failed to update vendor status');
        }
      } else {
        const kycId = selectedVendor?._id;
        const res = await fetch(`https://server.apexbee.in/api/admin/service-providers/kyc/${kycId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            verificationStatus: status === 'active' ? 'Approved' : 'Rejected',
            remarks: remarks || ''
          })
        });
        if (res.ok) {
          alert(`Service Provider KYC updated to: ${status === 'active' ? 'Approved' : 'Rejected'}`);
          fetchData();
        } else {
          const err = await res.json();
          alert(err.message || 'Failed to update KYC status');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getMappedStatus = (v: IVendor): 'Pending KYC' | 'Approved' | 'Suspended' | 'Additional Docs Requested' => {
    if (v.status === 'suspended') return 'Suspended';
    if (v.status === 'additional_docs_requested') return 'Additional Docs Requested';

    const hasPending = v.documents?.some(d => d.status === 'Pending');
    const hasRejected = v.documents?.some(d => d.status === 'Rejected');

    if (hasPending) return 'Pending KYC';
    if (hasRejected) return 'Additional Docs Requested';

    return v.status === 'active' ? 'Approved' : 'Pending KYC';
  };

  const filteredVendors = vendors.filter(v => {
    const mapped = getMappedStatus(v);
    const matchesFilter = filter === 'All' || mapped === filter;
    const matchesSearch = v.businessName.toLowerCase().includes(search.toLowerCase()) ||
      v.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (mappedStatus: string) => {
    switch (mappedStatus) {
      case 'Approved':
        return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 font-bold rounded-lg text-[10px] flex items-center gap-1"><CheckCircle size={10} /> Verified</span>;
      case 'Suspended':
        return <span className="px-2.5 py-1 bg-rose-500/10 text-rose-500 font-bold rounded-lg text-[10px] flex items-center gap-1"><AlertOctagon size={10} /> Suspended</span>;
      case 'Pending KYC':
        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 font-bold rounded-lg text-[10px] flex items-center gap-1 animate-pulse"><ClockIcon /> Pending Audit</span>;
      case 'Additional Docs Requested':
        return <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-500 font-bold rounded-lg text-[10px] flex items-center gap-1"><AlertCircle size={10} /> Docs Requested</span>;
      default:
        return null;
    }
  };

  const ClockIcon = () => (
    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const getProfilePhoto = (v: IVendor) => {
    const doc = v.documents?.find(d => d.id === 'DOC-PROFILE');
    return doc?.url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400';
  };

  const defaultBank = selectedVendor ? (selectedVendor.bankAccounts?.find(b => b.isDefault) || selectedVendor.bankAccounts?.[0] || null) : null;

  return (
    <div className="space-y-6">
      {/* Entity Selector Tabs */}
      <div className="flex gap-2 p-1.5 bg-secondary/20 rounded-2xl border border-border w-fit">
        <button
          onClick={() => setEntityType('vendor')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${entityType === 'vendor' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Vendor KYC
        </button>
        <button
          onClick={() => setEntityType('service_provider')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${entityType === 'service_provider' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Service Provider KYC
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="flex gap-2 flex-wrap">
          {(['All', 'Pending KYC', 'Approved', 'Suspended'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all select-none border ${filter === f
                ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/10'
                : 'bg-card text-muted-foreground border-border hover:bg-secondary/40 hover:text-foreground'
                }`}
            >
              {f === 'Pending KYC' ? 'Pending Review' : f}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72 shrink-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search business, owner, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border/80 focus:border-primary/80 rounded-xl bg-secondary/20 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Sellers Master List */}
        <div className="lg:col-span-2 bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border/60">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              {entityType === 'vendor' ? 'Registered Vendors' : 'Registered Service Providers'}
            </h3>
          </div>

          <div className="divide-y divide-border/60">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
                {entityType === 'vendor' ? 'Loading vendors from database...' : 'Loading service providers from database...'}
              </div>
            ) : filteredVendors.map(vendor => (
              <div
                key={vendor._id}
                onClick={() => {
                  setSelectedVendor(vendor);
                  setShowRejectInput(false);
                  setCommentText('');
                }}
                className={`p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-all ${selectedVendor?._id === vendor._id ? 'bg-secondary/40 border-l-4 border-primary' : ''
                  }`}
              >
                <div className="flex gap-3 overflow-hidden">
                  <img
                    src={getProfilePhoto(vendor)}
                    alt={vendor.ownerName}
                    className="w-10 h-10 rounded-lg object-cover ring-1 ring-border shrink-0"
                  />
                  <div className="overflow-hidden">
                    <p className="font-semibold text-xs text-foreground truncate">{vendor.businessName}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {vendor.ownerName} • {entityType === 'vendor' ? 'Vendor' : 'Service Provider'}
                    </p>
                    <p className="text-[9px] text-muted-foreground/75 mt-0.5 font-mono truncate">{vendor.email} | Joined: {vendor.createdAt ? vendor.createdAt.substring(0, 10) : 'N/A'}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  {getStatusBadge(getMappedStatus(vendor))}
                  <button className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-0.5">
                    Audit <Eye size={10} />
                  </button>
                </div>
              </div>
            ))}
            {!loading && filteredVendors.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No profiles matching this filter found.
              </div>
            )}
          </div>
        </div>

        {/* Audit / Details Pane */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-5">
          {selectedVendor ? (
            <>
              {/* Header Profile */}
              <div className="flex gap-3 pb-4 border-b border-border">
                <img
                  src={getProfilePhoto(selectedVendor)}
                  alt={selectedVendor.ownerName}
                  className="w-14 h-14 rounded-xl object-cover ring-1 ring-border shrink-0"
                />
                <div>
                  <h3 className="text-xs font-bold text-foreground">{selectedVendor.businessName}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {selectedVendor.ownerName} • {entityType === 'vendor' ? 'Vendor' : 'Service Provider'}
                  </p>
                  <div className="mt-1.5">{getStatusBadge(getMappedStatus(selectedVendor))}</div>
                </div>
              </div>

              {/* Business details */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Business Registry Details</h4>
                <div className="grid grid-cols-2 gap-3 text-[10px] bg-secondary/10 p-3 rounded-xl border border-border/40 text-left">
                  <div>
                    <span className="text-muted-foreground block text-[9px] font-bold">GST NUMBER</span>
                    <span className="font-mono text-foreground font-semibold block mt-0.5">{selectedVendor.gstNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px] font-bold">PAN NUMBER</span>
                    <span className="font-mono text-foreground font-semibold block mt-0.5">{selectedVendor.panNumber || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground block text-[9px] font-bold">CONTACT EMAIL</span>
                    <span className="font-mono text-foreground font-semibold block mt-0.5 truncate">{selectedVendor.email}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground block text-[9px] font-bold">CONTACT MOBILE</span>
                    <span className="font-mono text-foreground font-semibold block mt-0.5">{selectedVendor.mobile}</span>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="space-y-3 text-left">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Settlement Bank Account</h4>
                {defaultBank ? (
                  <div className="text-[10px] space-y-1.5 bg-secondary/10 p-3 rounded-xl border border-border/40">
                    <div className="flex justify-between"><span className="text-muted-foreground">Bank Name</span><span className="font-medium text-foreground">{defaultBank.bankName}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Account Holder</span><span className="font-medium text-foreground">{defaultBank.accountName}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Account Number</span><span className="font-mono font-medium text-foreground">{defaultBank.accountNumber}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">IFSC Code</span><span className="font-mono font-medium text-foreground">{defaultBank.ifscCode}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium text-foreground">{defaultBank.accountType}</span></div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground p-3 border border-dashed border-border rounded-xl text-center">
                    No bank accounts configured by seller.
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2 text-left">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Registered Address</span>
                <p className="text-[10px] text-foreground leading-relaxed bg-secondary/10 p-3 rounded-xl border border-border/40">
                  {selectedVendor.address}, {selectedVendor.pincode}
                </p>
              </div>

              {/* Document Audits Grid */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Uploaded KYC Credentials</h4>
                <div className="flex flex-col gap-2">
                  {selectedVendor.documents?.map(doc => (
                    <div
                      key={doc.id}
                      className="border border-border bg-card p-3 rounded-xl flex flex-col gap-2.5 text-xs text-left"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText size={16} className="text-primary shrink-0" />
                          <div className="truncate">
                            <span className="font-bold text-foreground block">{doc.name}</span>
                            <span className="text-[9px] text-muted-foreground truncate block">{doc.fileName || 'Not uploaded'}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${doc.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' :
                          doc.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 animate-pulse' :
                            doc.status === 'Rejected' ? 'bg-rose-500/10 text-rose-500' :
                              'bg-secondary/40 text-muted-foreground'
                          }`}>
                          {doc.status}
                        </span>
                      </div>

                      {doc.url && (
                        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border/40 mt-1">
                          <button
                            type="button"
                            onClick={() => setZoomDoc({ title: doc.name, url: doc.url! })}
                            className="text-[10px] text-primary hover:underline font-bold"
                          >
                            View Document
                          </button>

                          {doc.status === 'Pending' && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateDocStatus(selectedVendor.userId, doc.id, 'Approved')}
                                className="px-2 py-1 bg-emerald-500 text-white rounded text-[10px] font-bold hover:bg-emerald-600 transition-all"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateDocStatus(selectedVendor.userId, doc.id, 'Rejected')}
                                className="px-2 py-1 bg-rose-500 text-white rounded text-[10px] font-bold hover:bg-rose-600 transition-all"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Request Custom Document Form */}
              <div className="pt-2 border-t border-border space-y-2.5 text-left">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Request Additional Document</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="e.g. Trade License"
                    value={newDocRequestName}
                    onChange={(e) => setNewDocRequestName(e.target.value)}
                    className="flex-grow text-xs px-2.5 py-1.5 border border-border rounded-xl bg-secondary/15 outline-none focus:border-primary text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => handleRequestCustomDoc(selectedVendor.userId)}
                    className="p-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Verification Actions */}
              <div className="pt-2 border-t border-border space-y-3">
                {showRejectInput ? (
                  <div className="space-y-2.5 animate-fadeIn text-left">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Suspended / Remarks Reason</label>
                    <textarea
                      placeholder="Specify the reason why this seller is suspended..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="w-full text-xs p-2.5 border border-border/80 focus:border-rose-500 rounded-xl bg-secondary/10 outline-none h-20 placeholder:text-muted-foreground text-foreground"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          handleUpdateVendorStatus(selectedVendor.userId, 'suspended', commentText);
                          setShowRejectInput(false);
                        }}
                        className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all"
                      >
                        Confirm Suspend
                      </button>
                    </div>
                    <button
                      onClick={() => setShowRejectInput(false)}
                      className="w-full py-1.5 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-xl text-[10px] font-bold transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedVendor.status !== 'active' && (
                      <button
                        onClick={() => {
                          handleUpdateVendorStatus(selectedVendor.userId, 'active', 'KYC verified and approved by admin.');
                        }}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/15 transition-all cursor-pointer"
                      >
                        <ShieldCheck size={16} /> Approve KYC Credentials
                      </button>
                    )}

                    <div className="flex gap-2">
                      {selectedVendor.status === 'active' && (
                        <button
                          onClick={() => setShowRejectInput(true)}
                          className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-500 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <XCircle size={14} /> Suspend Seller
                        </button>
                      )}

                      {selectedVendor.status === 'suspended' && (
                        <button
                          onClick={() => handleUpdateVendorStatus(selectedVendor.userId, 'active', 'Vendor profile reactivated by Admin.')}
                          className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-500 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <CheckCircle size={14} /> Reactivate Seller
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-xs text-muted-foreground select-none">
              <ShieldCheck size={40} className="text-muted-foreground/30 stroke-1 mb-4" />
              <p>Select a seller from the left panel to audit their business KYC profile and uploaded credentials.</p>
            </div>
          )}
        </div>

      </div>

      {/* Document Zoom Modal */}
      <AnimatePresence>
        {zoomDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-card border border-border max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl p-4 relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <span className="text-xs font-bold text-foreground">Document View: {zoomDoc.title}</span>
                <button
                  onClick={() => setZoomDoc(null)}
                  className="p-1 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
              <img src={zoomDoc.url} alt={zoomDoc.title} className="w-full max-h-[75vh] object-contain rounded-xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
