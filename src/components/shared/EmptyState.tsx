import { forwardRef } from "react";
import GhButton from "./GhButton";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon = "📭", title, description, actionLabel, onAction }, ref) => {
    return (
      <div ref={ref} className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="font-display text-base font-bold text-foreground mb-1">{title}</h3>
        {description && <p className="text-sm text-muted-foreground text-center max-w-xs mb-4">{description}</p>}
        {actionLabel && onAction && (
          <GhButton variant="primary" size="md" onClick={onAction}>{actionLabel}</GhButton>
        )}
      </div>
    );
  }
);
EmptyState.displayName = "EmptyState";

export default EmptyState;
