import { cn } from '@/lib/utils';

const statusConfig = {
  diminta: { label: 'Diminta', className: 'status-requested' },
  disetujui: { label: 'Disetujui', className: 'status-approved' },
  dipinjam: { label: 'Dipinjam', className: 'status-borrowed' },
  terlambat: { label: 'Terlambat', className: 'status-overdue' },
  dikembalikan: { label: 'Dikembalikan', className: 'status-returned' },
};

export function StatusBadge({ status, className }) {
  const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  
  return (
    <span className={cn('status-badge', config.className, className)}>
      {config.label}
    </span>
  );
}
