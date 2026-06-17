import LoanStatusBadge from '@/Components/LoanStatusBadge';
import DataPagination from "@/Components/DataPagination";
import { useState } from "react";

export function RecentLoansTable({
  loans = [],
  showActions = false,
  onApprove,
  onReject,
  pageSize = 5,
}) {
  const [page, setPage] = useState(1);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const total = loans.length;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, lastPage);
  const start = (safePage - 1) * pageSize;
  const pagedLoans = loans.slice(start, start + pageSize);

  const from = total ? (safePage - 1) * pageSize + 1 : 0;
  const to = total ? Math.min(safePage * pageSize, total) : 0;

  if (!loans.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Belum ada data peminjaman
      </p>
    );
  }

  return (
    <div className="data-table overflow-hidden">
      <div className="-mx-1 overflow-x-auto px-1 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="bg-secondary/50">
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-4 sm:py-3">
                Peminjam
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-4 sm:py-3">
                Peralatan
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-4 sm:py-3">
                Tanggal Pinjam
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-4 sm:py-3">
                Jatuh Tempo
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-4 sm:py-3">
                Status
              </th>
              {showActions && (
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-4 sm:py-3">
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pagedLoans.map((loan) => (
              <tr key={loan.id} className="hover:bg-secondary/30 transition-colors">
                <td className="px-3 py-3 sm:px-4 sm:py-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{loan.borrowerName}</p>
                    <p className="text-xs text-muted-foreground">{loan.borrowerClass}</p>
                  </div>
                </td>
                <td className="px-3 py-3 sm:px-4 sm:py-4">
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
                <td className="px-3 py-3 sm:px-4 sm:py-4">
                  <LoanStatusBadge
                    status={loan.status}
                    itemType={loan.item_type}
                  />
                </td>
                {showActions && loan.status === 'diminta' && (
                  <td className="px-3 py-3 sm:px-4 sm:py-4">
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
      <DataPagination
        currentPage={safePage}
        lastPage={lastPage}
        from={from}
        to={to}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
