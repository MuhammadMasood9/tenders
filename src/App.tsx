/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Search, MapPin, Building2, Calendar, Clock, ExternalLink, ChevronLeft, ChevronRight, Loader2, Info, X, ArrowLeft, Download, FileText, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Tender {
  tenderNo: string;
  title: string;
  category: string;
  organization: string;
  location: string;
  type: string;
  publishedDate: string;
  closingDate: string;
  closingTime: string;
  detailsLink: string | null;
}

interface TenderDetails {
  tenderNo: string;
  title: string;
  organization: Record<string, string>;
  tenderInfo: Record<string, string>;
  dates: Record<string, string>;
  hasCorrigendum?: boolean;
  documents: {
    tenderDocument?: string;
    advertisement?: string;
  };
}

interface Pagination {
  currentPage: number;
  hasMore: boolean;
}

export default function App() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ currentPage: 1, hasMore: false });
  const [error, setError] = useState<string | null>(null);
  const [selectedTenderId, setSelectedTenderId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<TenderDetails | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    keyword: '',
    tender_no: '',
    closing_date: '',
    tender_type: '',
    procurement_category: '',
    tender_nature: ''
  });

  const fetchTenders = async (pageNum: number, currentFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        ...currentFilters
      });
      const response = await fetch(`/api/tenders?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch tenders');
      const data = await response.json();
      setTenders(data.tenders);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setPage(1); // Reset to page 1 on filter change
    fetchTenders(1, newFilters);
  };

  const fetchDetails = async (id: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/tenders/details/${id}`);
      if (!response.ok) throw new Error('Failed to fetch details');
      const data = await response.json();
      setDetailData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchTenders(page);
  }, [page]);

  useEffect(() => {
    if (selectedTenderId) {
      fetchDetails(selectedTenderId);
    } else {
      setDetailData(null);
    }
  }, [selectedTenderId]);

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] bg-[#E4E3E0] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#141414] text-[#E4E3E0] flex items-center justify-center font-bold text-xl">
              P
            </div>
            <div>
              <h1 className="font-serif italic text-xl leading-none">PPRA Tenders</h1>
              <p className="text-[10px] uppercase tracking-widest opacity-50 font-mono mt-1">Real-time Monitoring System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 border border-[#141414] rounded-full text-xs font-mono">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              LIVE DATA
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search & Filters Bar */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Main Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
              <input
                type="text"
                placeholder="Search by title, description, or keyword..."
                className="w-full pl-12 pr-4 py-4 bg-white border border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-all font-mono text-sm"
                value={filters.keyword}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
              />
            </div>
            {/* Tender No Search */}
            <div className="md:w-64 relative">
              <input
                type="text"
                placeholder="Tender Number..."
                className="w-full px-4 py-4 bg-white border border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-all font-mono text-sm uppercase"
                value={filters.tender_no}
                onChange={(e) => handleFilterChange('tender_no', e.target.value)}
              />
            </div>
          </div>

          {/* Quick Category Filters */}
          <div className="flex flex-col gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest opacity-40">Quick Category Filters</span>
            <div className="flex flex-wrap gap-2">
              {['CIVIL GOODS', 'MISCELLANEOUS', 'EQUIPMENTS', 'WORKS', 'SERVICES', 'STATIONERY'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleFilterChange('keyword', cat)}
                  className={`px-4 py-2 border border-[#141414] font-mono text-[10px] uppercase tracking-wider transition-all ${
                    filters.keyword === cat 
                    ? 'bg-[#141414] text-[#E4E3E0] shadow-[2px_2px_0px_0px_rgba(20,20,20,0.2)]' 
                    : 'bg-white hover:bg-[#141414]/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <select
              className="px-4 py-2 bg-white border border-[#141414] font-mono text-[10px] uppercase tracking-wider focus:outline-none"
              value={filters.tender_type}
              onChange={(e) => handleFilterChange('tender_type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="1">Tender Notice</option>
              <option value="2">Pre-qualification (PQ)</option>
              <option value="3">Request for Proposal (RFP)</option>
              <option value="4">Expression of Interest (EOI)</option>
            </select>

            <select
              className="px-4 py-2 bg-white border border-[#141414] font-mono text-[10px] uppercase tracking-wider focus:outline-none"
              value={filters.procurement_category}
              onChange={(e) => handleFilterChange('procurement_category', e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="1">Goods</option>
              <option value="2">Works</option>
              <option value="3">Consultancy Services</option>
              <option value="4">Non-consultancy Services</option>
            </select>

            <select
              className="px-4 py-2 bg-white border border-[#141414] font-mono text-[10px] uppercase tracking-wider focus:outline-none"
              value={filters.tender_nature}
              onChange={(e) => handleFilterChange('tender_nature', e.target.value)}
            >
              <option value="">All Nature</option>
              <option value="0">Local</option>
              <option value="1">International</option>
            </select>

            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-[#141414]">
              <span className="font-mono text-[10px] uppercase opacity-40">Closing:</span>
              <input
                type="date"
                className="font-mono text-[10px] uppercase focus:outline-none bg-transparent"
                value={filters.closing_date}
                onChange={(e) => handleFilterChange('closing_date', e.target.value)}
              />
            </div>

            <button
              onClick={() => {
                const reset = { keyword: '', tender_no: '', closing_date: '', tender_type: '', procurement_category: '', tender_nature: '' };
                setFilters(reset);
                setPage(1);
                fetchTenders(1, reset);
              }}
              className="px-4 py-2 border border-[#141414] font-mono text-[10px] uppercase tracking-wider hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors ml-auto"
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Stats / Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="border border-[#141414] p-6 bg-white shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <p className="font-serif italic text-sm opacity-60 mb-1">Status</p>
            <p className="text-2xl font-mono font-bold uppercase">Active</p>
          </div>
          <div className="border border-[#141414] p-6 bg-white shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <p className="font-serif italic text-sm opacity-60 mb-1">Source</p>
            <p className="text-2xl font-mono font-bold uppercase">EPMS PPRA</p>
          </div>
          <div className="border border-[#141414] p-6 bg-white shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <p className="font-serif italic text-sm opacity-60 mb-1">Last Updated</p>
            <p className="text-2xl font-mono font-bold uppercase">{new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="border border-[#141414] bg-white shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 border-b border-[#141414] bg-[#141414] text-[#E4E3E0] text-[11px] uppercase tracking-wider font-mono py-3 px-4">
            <div className="col-span-2">Tender No</div>
            <div className="col-span-5">Title & Organization</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Closing Date</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          {/* Table Body */}
          <div className="min-h-[600px] relative">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10"
                >
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <p className="font-mono text-xs uppercase tracking-widest">Fetching Tenders...</p>
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-12 text-center"
                >
                  <Info className="w-12 h-12 mx-auto mb-4 text-red-500" />
                  <h3 className="text-xl font-serif italic mb-2">Connection Error</h3>
                  <p className="text-sm opacity-60 mb-6">{error}</p>
                  <button
                    onClick={() => fetchTenders(page)}
                    className="px-6 py-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors font-mono text-xs uppercase"
                  >
                    Retry Connection
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {tenders.map((tender) => (
                    <div
                      key={tender.tenderNo}
                      onClick={() => setSelectedTenderId(tender.tenderNo)}
                      className="grid grid-cols-12 border-b border-[#141414]/10 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all group py-4 px-4 cursor-pointer"
                    >
                      <div className="col-span-2 font-mono text-xs self-center">
                        {tender.tenderNo}
                        {tender.type && (
                          <span className="block mt-1 text-[9px] uppercase px-1.5 py-0.5 border border-current w-fit opacity-70">
                            {tender.type}
                          </span>
                        )}
                      </div>
                      <div className="col-span-5 pr-4">
                        <h3 className="font-medium text-sm leading-tight mb-1 group-hover:text-white">
                          {tender.title}
                        </h3>
                        <div className="flex items-center gap-3 text-[10px] opacity-60 font-mono">
                          <span className="flex items-center gap-1">
                            <Building2 size={10} />
                            {tender.organization}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={10} />
                            {tender.location}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2 self-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFilterChange('keyword', tender.category);
                          }}
                          className="text-[10px] uppercase font-mono px-2 py-1 bg-[#141414]/5 group-hover:bg-white/20 rounded hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
                        >
                          {tender.category}
                        </button>
                      </div>
                      <div className="col-span-2 self-center">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-bold">{tender.closingDate}</span>
                          <span className="text-[10px] opacity-60 font-mono">{tender.closingTime}</span>
                        </div>
                      </div>
                      <div className="col-span-1 text-right self-center">
                        <div className="inline-flex items-center justify-center w-8 h-8 border border-current hover:bg-white hover:text-[#141414] transition-colors">
                          <ExternalLink size={14} />
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Pagination Footer */}
          <div className="border-t border-[#141414] p-4 flex items-center justify-between bg-[#f8f8f7]">
            <div className="text-[10px] font-mono uppercase opacity-50">
              Page {page} of Data Stream
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1 || loading}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-2 border border-[#141414] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={!pagination.hasMore || loading}
                onClick={() => setPage(p => p + 1)}
                className="p-2 border border-[#141414] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Detail Overlay */}
      <AnimatePresence>
        {selectedTenderId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-end bg-[#141414]/40 backdrop-blur-sm"
            onClick={() => setSelectedTenderId(null)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl h-full bg-[#E4E3E0] border-l border-[#141414] shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Overlay Header */}
              <div className="border-b border-[#141414] p-6 flex items-center justify-between bg-[#E4E3E0]">
                <button
                  onClick={() => setSelectedTenderId(null)}
                  className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest hover:opacity-60 transition-opacity"
                >
                  <ArrowLeft size={14} /> Back to List
                </button>
                <div className="flex items-center gap-4">
                  <button className="p-2 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors rounded-full border border-[#141414]">
                    <Printer size={16} />
                  </button>
                  <button
                    onClick={() => setSelectedTenderId(null)}
                    className="p-2 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors rounded-full border border-[#141414]"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Overlay Content */}
              <div className="flex-1 overflow-y-auto p-8">
                {detailLoading ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-40">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <p className="font-mono text-xs uppercase tracking-widest">Loading Details...</p>
                  </div>
                ) : detailData ? (
                  <div className="space-y-10">
                    {/* Title Section */}
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="font-mono text-[10px] uppercase px-2 py-1 bg-[#141414] text-[#E4E3E0]">
                          {detailData.tenderNo}
                        </span>
                        {detailData.hasCorrigendum && (
                          <span className="font-mono text-[10px] uppercase px-2 py-1 border border-[#141414] text-red-600 font-bold">
                            Corrigendum Issued
                          </span>
                        )}
                      </div>
                      <h2 className="text-3xl font-serif italic leading-tight mb-4">
                        {detailData.title}
                      </h2>
                    </section>

                    {/* Organization Details */}
                    <section>
                      <h3 className="font-mono text-[11px] uppercase tracking-widest opacity-40 mb-4 border-b border-[#141414]/10 pb-2">
                        Organization Details
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        {Object.entries(detailData.organization).map(([key, value]) => (
                          <div key={key} className="flex flex-col border-b border-[#141414]/5 pb-2">
                            <span className="font-serif italic text-xs opacity-60">{key}</span>
                            <span className="text-sm font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Tender Information */}
                    <section>
                      <h3 className="font-mono text-[11px] uppercase tracking-widest opacity-40 mb-4 border-b border-[#141414]/10 pb-2">
                        Tender Information
                      </h3>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        {Object.entries(detailData.tenderInfo).map(([key, value]) => (
                          <div key={key} className={`flex flex-col ${key === 'Note' || key === 'Remarks' ? 'col-span-2 bg-[#141414]/5 p-4' : ''}`}>
                            <span className="font-serif italic text-xs opacity-60 mb-1">{key}</span>
                            <span className="text-sm font-medium">{value || 'N/A'}</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Important Dates */}
                    <section>
                      <h3 className="font-mono text-[11px] uppercase tracking-widest opacity-40 mb-4 border-b border-[#141414]/10 pb-2">
                        Important Dates
                      </h3>
                      <div className="grid grid-cols-2 gap-6">
                        {Object.entries(detailData.dates).map(([key, value]) => (
                          <div key={key} className="flex items-start gap-3">
                            <Calendar size={16} className="mt-1 opacity-40" />
                            <div className="flex flex-col">
                              <span className="font-serif italic text-xs opacity-60">{key}</span>
                              <span className="text-sm font-medium">{value}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Action Buttons */}
                    <section className="pt-10 flex flex-wrap gap-4">
                      {detailData.documents.tenderDocument && (
                        <a
                          href={detailData.documents.tenderDocument}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#141414] text-[#E4E3E0] font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
                        >
                          <Download size={16} /> Tender Document
                        </a>
                      )}
                      {detailData.documents.advertisement && (
                        <a
                          href={detailData.documents.advertisement}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 py-4 border border-[#141414] font-mono text-xs uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                        >
                          <FileText size={16} /> Advertisement
                        </a>
                      )}
                    </section>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
