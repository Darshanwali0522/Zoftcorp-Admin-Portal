import React from 'react';
import { Metadata } from 'next';
import { TagsManager } from '@/components/taxonomy/TagsManager';

export const metadata: Metadata = {
  title: 'Tags | ZOFT Corp Admin Portal',
  description: 'Manage article tags, technology labels, and keywords.',
};

export default function TagsPage() {
  return <TagsManager />;
}
