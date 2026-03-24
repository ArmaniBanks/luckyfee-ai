import { ExternalLink } from 'lucide-react';
export default function Footer() {
  return (
    <footer className="border-t border-bags-border mt-16 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3"><img src="/logo.jpeg" alt="LuckyFee AI" className="w-7 h-7 rounded-lg object-cover" /><span className="text-sm text-bags-muted">LuckyFee AI</span></div>
        <a href="https://bags.fm/apps" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-bags-muted hover:text-bags-primary transition-colors">Powered by Bags <ExternalLink size={12} /></a>
      </div>
    </footer>
  );
}
