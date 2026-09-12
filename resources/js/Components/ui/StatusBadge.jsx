import { cn } from '@/lib/utils';

const statusConfig = {
  diminta: { label: 'Menunggu Persetujuan', className: 'border-transparent bg-blue-50 text-blue-700' },
  antrian: { label: 'Antrian', className: 'border-transparent bg-amber-50 text-amber-800' },
  disetujui: { label: 'Disetujui', className: 'border-transparent bg-emerald-50 text-emerald-700' },
  ditolak: { label: 'Ditolak', className: 'border-transparent bg-red-50 text-red-700' },
  dipinjam: { label: 'Dipinjam', className: 'border-transparent bg-sky-50 text-sky-700' },
  terlambat: { label: 'Terlambat', className: 'border-transparent bg-red-50 text-red-700' },
  menunggu_inspeksi: { label: 'Menunggu Inspeksi', className: 'border-transparent bg-amber-50 text-amber-800' },
  dikembalikan: { label: 'Dikembalikan', className: 'border-transparent bg-muted text-muted-foreground' },
  dibatalkan: { label: 'Dibatalkan', className: 'border-transparent bg-muted text-muted-foreground' },
};

export function StatusBadge({ status, className }) {
  const config = statusConfig[status] || { label: status, className: 'border-transparent bg-muted text-muted-foreground' };
  
  return (
    <span className={cn('status-badge', config.className, className)}>
      {config.label}
    </span>
  );
}
