'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
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
import { EventItem, EventFormValues } from '@/types/events';
import {
  getEvents,
  createEvent,
  updateEvent,
  toggleEventPublishStatus,
  deleteEvent,
} from '@/lib/supabase/events-service';
import { EventListTable } from '@/components/events/EventListTable';
import { EventModal } from '@/components/events/EventModal';
import { DeleteEventModal } from '@/components/events/DeleteEventModal';

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<EventItem | null>(null);

  // Notifications
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  const [isSchemaMissing, setIsSchemaMissing] = useState(false);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    const res = await getEvents({
      search,
      status: statusFilter,
    });
    setEvents(res.data);
    setIsSchemaMissing(Boolean(res.isSchemaMissing));
    if (res.error && !res.isSchemaMissing) {
      setNotification({ type: 'error', message: res.error });
    }
    setIsLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (event: EventItem) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (
    values: EventFormValues
  ): Promise<{ success: boolean; error?: string }> => {
    if (editingEvent) {
      const res = await updateEvent(editingEvent.id, values);
      if (res.error) {
        return { success: false, error: res.error };
      }
      setNotification({
        type: 'success',
        message: `Event "${values.title}" updated successfully.`,
      });
    } else {
      const res = await createEvent(values);
      if (res.error) {
        return { success: false, error: res.error };
      }
      setNotification({
        type: 'success',
        message: `Event "${values.title}" created successfully.`,
      });
    }
    await fetchEvents();
    return { success: true };
  };

  const handleToggleStatus = async (event: EventItem) => {
    const res = await toggleEventPublishStatus(event.id, event.status);
    if (!res.success) {
      setNotification({ type: 'error', message: res.error || 'Failed to update publication status.' });
    } else {
      setNotification({
        type: 'success',
        message: `Event "${event.title}" is now ${res.newStatus}.`,
      });
      await fetchEvents();
    }
  };

  const handleDeleteEvent = async () => {
    if (!deletingEvent) return;
    const res = await deleteEvent(deletingEvent.id);
    if (!res.success) {
      setNotification({ type: 'error', message: res.error || 'Failed to delete event.' });
    } else {
      setNotification({
        type: 'success',
        message: `Event "${deletingEvent.title}" deleted successfully.`,
      });
      await fetchEvents();
    }
    setDeletingEvent(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#01153B] tracking-tight">
              Events &amp; Meetups
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#00B3FF]/10 text-[#0077B6] border border-[#00B3FF]/30">
              {events.length} {events.length === 1 ? 'Session' : 'Sessions'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage upcoming webinars, community roundtables, architecture workshops, and published session recordings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchEvents()}
            leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
            disabled={isLoading}
          >
            Refresh
          </Button>

          <Button
            variant="orange"
            size="sm"
            onClick={handleOpenAdd}
            leftIcon={<PlusCircle className="h-4 w-4" />}
          >
            Add Event / Meetup
          </Button>
        </div>
      </div>

      {/* Database Schema Setup Notice */}
      {isSchemaMissing && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-amber-950">
                Setup Required: Supabase `events` Table Pending
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                The database schema for Events &amp; Meetups has not yet been applied to your Supabase project (<strong>qnahdmwjsgyxspvuntbh</strong>).
                To enable persistent event publishing, open your Supabase SQL Editor and execute the migration file:
                <code className="ml-1 px-1.5 py-0.5 rounded bg-amber-200/80 font-mono text-[11px] text-amber-950">
                  supabase/migrations/20261027_events_and_meetups.sql
                </code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <Alert
          type={notification.type === 'error' ? 'error' : notification.type === 'success' ? 'success' : 'warning'}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Filters Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, location, or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00B3FF]/40 focus:border-[#00B3FF] bg-slate-50/50 hover:bg-white transition-colors"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg shrink-0 self-start sm:self-auto">
          {(['all', 'published', 'draft'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                statusFilter === filter
                  ? 'bg-white text-[#01153B] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {filter === 'all' ? 'All Sessions' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table */}
      <EventListTable
        events={events}
        isLoading={isLoading}
        onEdit={handleOpenEdit}
        onDelete={(event) => setDeletingEvent(event)}
        onToggleStatus={handleToggleStatus}
        onAdd={handleOpenAdd}
      />

      {/* Create / Edit Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        event={editingEvent}
      />

      {/* Delete Confirmation Modal */}
      <DeleteEventModal
        isOpen={Boolean(deletingEvent)}
        onClose={() => setDeletingEvent(null)}
        onConfirm={handleDeleteEvent}
        event={deletingEvent}
      />
    </div>
  );
}
