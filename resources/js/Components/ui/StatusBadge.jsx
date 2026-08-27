import { cn } from '@/lib/utils';

const statusConfig = {
  diminta: { label: 'Menunggu Persetujuan', className: 'border border-slate-200 bg-slate-100 text-slate-700' },
  antrian: { label: 'Antrian', className: 'border border-amber-200/80 bg-amber-50 text-amber-900/80' },
  disetujui: { label: 'Disetujui', className: 'border border-slate-200 bg-slate-100 text-slate-700' },
  ditolak: { label: 'Ditolak', className: 'border border-red-200/70 bg-red-50 text-red-800/80' },
  dipinjam: { label: 'Dipinjam', className: 'border border-amber-200/60 bg-amber-50/80 text-amber-950/70' },
  terlambat: { label: 'Terlambat', className: 'border border-red-200/70 bg-red-50 text-red-800/80' },
  menunggu_inspeksi: { label: 'Menunggu Inspeksi', className: 'border border-amber-200/80 bg-amber-50 text-amber-900/80' },
  dikembalikan: { label: 'Dikembalikan', className: 'border border-slate-200 bg-slate-50 text-slate-600' },
  dibatalkan: { label: 'Dibatalkan', className: 'border border-slate-200 bg-slate-50 text-slate-600' },
};

export function StatusBadge({ status, className }) {
  const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  
  return (
    <span className={cn('status-badge', config.className, className)}>
      {config.label}
    </span>
  );
}
