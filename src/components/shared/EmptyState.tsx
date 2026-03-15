// EmptyState component
import GhButton from "./GhButton";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon = "📭", title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-display text-base font-bold text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground text-center max-w-xs mb-4">{description}</p>}
      {actionLabel && onAction && (
        <GhButton variant="primary" size="md" onClick={onAction}>{actionLabel}</GhButton>
      )}
    </div>
  );
}
