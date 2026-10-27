'use client';

import React from 'react';
import {
  Edit2,
  Trash2,
  ExternalLink,
  Calendar,
  MapPin,
  Sparkles,
  Eye,
  EyeOff,
  Clock,
  Images,
} from 'lucide-react';
import { EventItem, ContentStatus } from '@/types/events';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface EventListTableProps {
  events: EventItem[];
  isLoading: boolean;
  onEdit: (event: EventItem) => void;
  onDelete: (event: EventItem) => void;
  onToggleStatus: (event: EventItem) => void;
  onAdd: () => void;
}

export function EventListTable({
  events,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
  onAdd,
}: EventListTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#00B3FF]" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Loading events and meetups...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
          <Calendar className="h-7 w-7 text-[#01153B]/60" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No events found</h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          Start scheduling technical webinars, community meetups, and architecture sessions.
        </p>
        <div className="mt-6">
          <Button variant="orange" size="sm" onClick={onAdd}>
            Schedule First Event
          </Button>
        </div>
      </div>
    );
  }

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return {
        date: d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        time: d.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
      };
    } catch {
      return { date: dateStr, time: '' };
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="px-6 py-3.5">
                Session &amp; Thumbnail
              </th>
              <th scope="col" className="px-6 py-3.5">
                Format
              </th>
              <th scope="col" className="px-6 py-3.5">
                Event Date &amp; Time
              </th>
              <th scope="col" className="px-6 py-3.5">
                Location
              </th>
              <th scope="col" className="px-6 py-3.5">
                Status
              </th>
              <th scope="col" className="px-6 py-3.5 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.map((event) => {
              const { date, time } = formatDateTime(event.event_date);
              const coverPhoto = event.photos && event.photos.length > 0 ? event.photos[0] : null;

              return (
                <tr
                  key={event.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Thumbnail & Title */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3.5 max-w-md">
                      <div className="h-14 w-20 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-2xs group-hover:border-[#00B3FF]/40 transition-colors relative flex items-center justify-center">
                        {coverPhoto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={coverPhoto}
                            alt={event.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Calendar className="h-6 w-6 text-slate-400" />
                        )}
                        {event.photos && event.photos.length > 1 && (
                          <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[9px] font-mono px-1 rounded flex items-center gap-0.5">
                            <Images className="h-2.5 w-2.5" />
                            {event.photos.length}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 group-hover:text-[#01153B] transition-colors block truncate">
                          {event.title}
                        </span>
                        <span className="text-xs text-slate-500 font-mono block truncate">
                          /{event.slug}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Format */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded bg-[#00B3FF]/10 text-[#0077B6] font-mono text-xs font-semibold uppercase tracking-wider">
                      {event.event_type || 'meetup'}
                    </span>
                  </td>

                  {/* Date & Time */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{date}</span>
                      </div>
                      {time && (
                        <div className="text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{time}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Location */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[150px]">{event.location || 'Virtual'}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={event.status === 'published' ? 'published' : 'draft'}>
                      {event.status === 'published' ? 'Published' : 'Draft'}
                    </Badge>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(event)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          event.status === 'published'
                            ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                            : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-100'
                        }`}
                        title={event.status === 'published' ? 'Unpublish to Draft' : 'Publish Event'}
                      >
                        {event.status === 'published' ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onEdit(event)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        title="Edit Event"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(event)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
