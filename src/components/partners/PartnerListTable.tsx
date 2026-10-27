'use client';

import React from 'react';
import { Edit2, Trash2, ExternalLink, Globe, Shield, Sparkles, Building2 } from 'lucide-react';
import { Partner } from '@/types/partners';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface PartnerListTableProps {
  partners: Partner[];
  isLoading: boolean;
  onEdit: (partner: Partner) => void;
  onDelete: (partner: Partner) => void;
  onAdd: () => void;
  onSeedDefaults?: () => void;
}

export function PartnerListTable({
  partners,
  isLoading,
  onEdit,
  onDelete,
  onAdd,
  onSeedDefaults,
}: PartnerListTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#00B3FF]" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Loading partner ecosystems...</p>
      </div>
    );
  }

  if (partners.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
          <Building2 className="h-7 w-7 text-[#01153B]/60" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No partner records found</h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          Start building your cloud and enterprise technology ecosystem directory.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button variant="orange" size="sm" onClick={onAdd}>
            Add First Partner
          </Button>
          {onSeedDefaults && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSeedDefaults}
              leftIcon={<Sparkles className="h-3.5 w-3.5 text-[#00B3FF]" />}
            >
              Initialize 4 Official Partners
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="px-6 py-3.5">
                Partner Ecosystem
              </th>
              <th scope="col" className="px-6 py-3.5">
                Identifier / Slug
              </th>
              <th scope="col" className="px-6 py-3.5">
                Short Description
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
            {partners.map((partner) => (
              <tr
                key={partner.id}
                className="hover:bg-slate-50/70 transition-colors group"
              >
                {/* Logo & Name */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-lg bg-slate-50 border border-slate-200 p-1.5 flex items-center justify-center shrink-0 shadow-2xs group-hover:border-[#00B3FF]/40 transition-colors">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={partner.logo_url}
                        alt={`${partner.name} logo`}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          // Fallback icon placeholder if asset fails to load
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 group-hover:text-[#01153B] transition-colors block">
                        {partner.name}
                      </span>
                      {partner.details && (
                        <span className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                          {partner.details}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Slug */}
                <td className="px-6 py-4">
                  <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                    {partner.slug}
                  </span>
                </td>

                {/* Description */}
                <td className="px-6 py-4">
                  <p className="text-xs text-slate-600 line-clamp-2 max-w-md leading-relaxed">
                    {partner.description}
                  </p>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  {partner.status === 'published' ? (
                    <Badge variant="published" size="xs">
                      Published
                    </Badge>
                  ) : (
                    <Badge variant="draft" size="xs">
                      Draft
                    </Badge>
                  )}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(partner)}
                      className="p-1.5 text-slate-500 hover:text-[#01153B] rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit partner"
                      aria-label={`Edit ${partner.name}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(partner)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete partner"
                      aria-label={`Delete ${partner.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
