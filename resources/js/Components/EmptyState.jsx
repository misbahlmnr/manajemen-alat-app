export default function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
            {Icon && (
                <Icon className="mb-4 h-12 w-12 text-muted-foreground/60" />
            )}
            {title && (
                <p className="text-base font-medium text-foreground">{title}</p>
            )}
            {description && (
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    {description}
                </p>
            )}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}
