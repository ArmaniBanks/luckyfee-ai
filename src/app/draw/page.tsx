'use client';

import { Trophy } from 'lucide-react';
import DrawEngine from '@/components/DrawEngine';

export default function DrawPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3"><Trophy size={28} className="text-bags-warning" />Random Winner Engine</h1>
        <p className="text-bags-muted mt-1">Automatic draw every 5 minutes. Winner receives 98% of the pool directly to their wallet.</p>
      </div>
      <div className="max-w-xl mx-auto"><DrawEngine /></div>
    </div>
  );
}
