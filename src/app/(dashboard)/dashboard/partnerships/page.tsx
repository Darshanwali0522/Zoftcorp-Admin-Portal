'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Handshake,
  PlusCircle,
  Search,
  RefreshCw,
  Sparkles,
  Filter,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Partner, PartnerFormValues } from '@/types/partners';
import {
  getPartners,
  createPartner,
  updatePartner,
  deletePartner,
  seedInitialPartners,
} from '@/lib/supabase/partners-service';
import { PartnerListTable } from '@/components/partners/PartnerListTable';
import { PartnerModal } from '@/components/partners/PartnerModal';
import { DeletePartnerModal } from '@/components/partners/DeletePartnerModal';

export default function PartnershipsPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [deletingPartner, setDeletingPartner] = useState<Partner | null>(null);

  // Notifications
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  const [isSchemaMissing, setIsSchemaMissing] = useState(false);

  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    const res = await getPartners({
      search,
      status: statusFilter,
    });
    setPartners(res.data);
    setIsSchemaMissing(Boolean(res.isSchemaMissing));
    if (res.error && !res.isSchemaMissing) {
      setNotification({ type: 'error', message: res.error });
    }
    setIsLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleOpenAdd = () => {
    setEditingPartner(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setIsModalOpen(true);
  };

  const handleSavePartner = async (
    values: PartnerFormValues
  ): Promise<{ success: boolean; error?: string }> => {
    if (editingPartner) {
      const res = await updatePartner(editingPartner.id, values);
      if (res.error) {
        return { success: false, error: res.error };
      }
      setNotification({
        type: 'success',
        message: `Partner "${values.name}" updated successfully.`,
      });
    } else {
      const res = await createPartner(values);
      if (res.error) {
        return { success: false, error: res.error };
      }
      setNotification({
        type: 'success',
        message: `Partner "${values.name}" created successfully.`,
      });
    }
    await fetchPartners();
    return { success: true };
  };

  const handleConfirmDelete = async () => {
    if (!deletingPartner) return;
    const res = await deletePartner(deletingPartner.id);
    if (!res.success) {
      setNotification({
        type: 'error',
        message: res.error || 'Failed to delete partner.',
      });
    } else {
      setNotification({
        type: 'success',
        message: `Partner "${deletingPartner.name}" deleted successfully.`,
      });
      await fetchPartners();
    }
    setDeletingPartner(null);
  };

  const handleSeedDefaults = async () => {
    setIsLoading(true);
    const res = await seedInitialPartners();
    if (res.error) {
      setNotification({
        type: 'error',
        message: res.error,
      });
    } else {
      setNotification({
        type: 'success',
        message: 'The four official partners (AWS, Microsoft Azure, Google Cloud, Oracle) are initialized without duplicates.',
      });
      await fetchPartners();
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#01153B] tracking-tight">
              Partnerships
            </h1>
            <span className="text-[11px] font-bold bg-[#00B3FF]/15 text-[#0077B6] px-2 py-0.5 rounded-full">
              {partners.length} {partners.length === 1 ? 'Partner' : 'Partners'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage enterprise cloud and database ecosystem partnerships (AWS, Azure, GCP, Oracle).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPartners}
            title="Refresh partners"
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          <Button
            variant="orange"
            size="md"
            onClick={handleOpenAdd}
            leftIcon={<PlusCircle className="h-4 w-4" />}
          >
            Add Partner
          </Button>
        </div>
      </div>

      {/* Schema Notice Banner if Supabase Migration Pending */}
      {isSchemaMissing && (
        <Alert
          type="warning"
          title="Supabase Database Migration Required"
          message={
            <div className="text-xs leading-relaxed space-y-1">
              <p>
                The database table <code className="bg-amber-100 font-mono px-1 py-0.5 rounded">public.partners</code> is not yet created in your connected Supabase instance (<code>qnahdmwjsgyxspvuntbh</code>).
              </p>
              <p>
                To enable persistent database operations, execute the safe migration in <code className="bg-amber-100 font-mono px-1 py-0.5 rounded">supabase/migrations/20261027_partners_and_reviews.sql</code> via the Supabase SQL Editor.
              </p>
            </div>
          }
        />
      )}

      {/* Notification Toast */}
      {notification && (
        <Alert
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search partners by name, description, or slug..."
            className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-[#00B3FF] bg-slate-50/50 focus:bg-white transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium hidden md:inline">Status:</span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                statusFilter === 'published'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                statusFilter === 'draft'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Draft
            </button>
          </div>
        </div>
      </div>

      {/* Partners List Table */}
      <PartnerListTable
        partners={partners}
        isLoading={isLoading}
        onEdit={handleOpenEdit}
        onDelete={(p) => setDeletingPartner(p)}
        onAdd={handleOpenAdd}
        onSeedDefaults={handleSeedDefaults}
      />

      {/* Partner Add/Edit Modal */}
      <PartnerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePartner}
        partner={editingPartner}
      />

      {/* Partner Delete Confirmation Dialog */}
      <DeletePartnerModal
        isOpen={Boolean(deletingPartner)}
        onClose={() => setDeletingPartner(null)}
        onConfirm={handleConfirmDelete}
        partner={deletingPartner}
      />
    </div>
  );
}
