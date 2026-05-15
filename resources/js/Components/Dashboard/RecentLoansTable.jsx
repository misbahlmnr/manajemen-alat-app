import { StatusBadge } from '@/Components/ui/StatusBadge';

export function RecentLoansTable({ loans, showActions = false, onApprove, onReject }) {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="data-table overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Peminjam
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Peralatan
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tanggal Pinjam
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Jatuh Tempo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              {showActions && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loans.map((loan) => (
              <tr key={loan.id} className="hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{loan.borrowerName}</p>
                    <p className="text-xs text-muted-foreground">{loan.borrowerClass}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div>
                    <p className="text-sm text-foreground">{loan.equipmentName}</p>
                    <p className="text-xs text-muted-foreground">Qty: {loan.quantity}</p>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-muted-foreground">
                  {formatDate(loan.borrowDate)}
                </td>
                <td className="px-4 py-4 text-sm text-muted-foreground">
                  {formatDate(loan.dueDate)}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={loan.status} />
                </td>
                {showActions && loan.status === 'diminta' && (
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onApprove?.(loan.id)}
                        className="px-3 py-1 text-xs font-medium bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors"
                      >
                        Setujui
                      </button>
                      <button
                        onClick={() => onReject?.(loan.id)}
                        className="px-3 py-1 text-xs font-medium bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
                      >
                        Tolak
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
