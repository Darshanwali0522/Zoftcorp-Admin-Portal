import React from 'react';
import { Metadata } from 'next';
import { CategoriesManager } from '@/components/taxonomy/CategoriesManager';

export const metadata: Metadata = {
  title: 'Categories | ZOFT Corp Admin Portal',
  description: 'Manage article categories, taxonomy slugs, and topic hierarchies.',
};

export default function CategoriesPage() {
  return <CategoriesManager />;
}
