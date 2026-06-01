import { cn } from '@/lib/utils';

const statusConfig = {
  diminta: { label: 'Menunggu Persetujuan', className: 'status-requested' },
  antrian: { label: 'Antrian', className: 'bg-warning/10 text-warning' },
  disetujui: { label: 'Disetujui', className: 'status-approved' },
  ditolak: { label: 'Ditolak', className: 'bg-destructive/10 text-destructive' },
  dipinjam: { label: 'Dipinjam', className: 'status-borrowed' },
  terlambat: { label: 'Terlambat', className: 'status-overdue' },
  menunggu_inspeksi: { label: 'Menunggu Inspeksi', className: 'bg-warning/10 text-warning' },
  dikembalikan: { label: 'Dikembalikan', className: 'status-returned' },
  dibatalkan: { label: 'Dibatalkan', className: 'bg-muted text-muted-foreground' },
};

export function StatusBadge({ status, className }) {
  const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  
  return (
    <span className={cn('status-badge', config.className, className)}>
      {config.label}
    </span>
  );
}
