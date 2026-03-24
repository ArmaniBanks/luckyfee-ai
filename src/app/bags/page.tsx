'use client';

import { Coins } from 'lucide-react';
import BagsTokenFeed from '@/components/BagsTokenFeed';
import BagsIntegration from '@/components/BagsIntegration';

export default function BagsFeedPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3"><Coins size={28} className="text-bags-primary" />Bags Ecosystem</h1>
        <p className="text-bags-muted mt-1">Live token launches and fee sharing analytics. Click any token to view on Bags.</p>
      </div>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3"><BagsTokenFeed /></div>
        <div className="lg:col-span-2"><BagsIntegration /></div>
      </div>
    </div>
  );
}
