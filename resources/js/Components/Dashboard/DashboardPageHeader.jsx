export function DashboardPageHeader({ title, subtitle }) {
    return (
        <div className="page-header">
            <div>
                <h1 className="section-title">{title}</h1>
                {subtitle && (
                    <p className="mt-1 text-muted-foreground">{subtitle}</p>
                )}
            </div>
        </div>
    );
}
