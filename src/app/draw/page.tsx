'use client';

import { Trophy } from 'lucide-react';
import DrawEngine from '@/components/DrawEngine';

export default function DrawPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3"><Trophy size={28} className="text-bags-warning" />Random Winner Engine</h1>
        <p className="text-bags-muted mt-1">Three pools, three timers. Auto-draw every 5 minutes per tier. Winner receives 98%.</p>
      </div>
      <DrawEngine />
    </div>
  );
}
