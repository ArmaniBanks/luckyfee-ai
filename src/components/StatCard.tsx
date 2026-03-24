import type { LucideIcon } from 'lucide-react';
export default function StatCard({ label, value, icon: Icon, subtitle, trend, glow }: { label: string; value: string; icon: LucideIcon; subtitle?: string; trend?: string; glow?: boolean }) {
  return (
    <div className={glow ? 'card-glow' : 'card'}>
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value mt-2">{value}</p>
          {subtitle && <p className={`text-xs mt-1.5 ${trend === 'up' ? 'text-bags-primary' : 'text-bags-muted'}`}>{subtitle}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-bags-primary/10 to-bags-accent/10 flex items-center justify-center"><Icon size={20} className="text-bags-primary" /></div>
      </div>
    </div>
  );
}
