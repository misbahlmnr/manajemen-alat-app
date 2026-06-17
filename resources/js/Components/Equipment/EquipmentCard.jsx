import EquipmentImage from '@/Components/Equipment/EquipmentImage';
import ConditionBreakdown from '@/Components/ConditionBreakdown';
import { Camera, Mic, Cable, Monitor, Lightbulb, Headphones, Video, Box } from 'lucide-react';
import { cn } from '@/lib/utils';

const categoryIcons = {
  Kamera: Camera,
  Mikrofon: Mic,
  Kabel: Cable,
  Mixer: Monitor,
  Lighting: Lightbulb,
  Headphone: Headphones,
  Stabilizer: Video,
  Tripod: Box,
};

export function EquipmentCard({ equipment, onBorrow, showBorrowButton = true }) {
  const Icon = categoryIcons[equipment.category] || Box;
  
  return (
    <div className="equipment-card animate-slide-up">
      {/* Header */}
      <div className="flex items-start gap-4">
        {equipment.image_url ? (
          <EquipmentImage
            imageUrl={equipment.image_url}
            name={equipment.name}
            className="h-14 w-14 shrink-0 rounded-xl border border-border/60"
            iconClassName="h-6 w-6"
          />
        ) : (
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-7 h-7 text-primary" />
        </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{equipment.name}</h3>
          <p className="text-sm text-muted-foreground">{equipment.category}</p>
        </div>
      </div>

      {/* Description */}
      {equipment.description && (
        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
          {equipment.description}
        </p>
      )}

      {/* Stock Info */}
      <div className="mt-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Ketersediaan</span>
          <span className={cn(
            "font-semibold px-2 py-0.5 rounded",
            equipment.available > 0 
              ? 'bg-success/10 text-success' 
              : 'bg-destructive/10 text-destructive'
          )}>
            {equipment.available} / {equipment.qty_baik ?? equipment.stock} baik
          </span>
        </div>
      </div>

      {/* Location */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Lokasi:</span>
        <span className="font-medium text-foreground">{equipment.location}</span>
      </div>

      <div className="mt-3">
        <ConditionBreakdown breakdown={equipment.condition_breakdown} compact />
      </div>

      <div className="mt-3 flex items-center justify-end">
        {showBorrowButton && equipment.available > 0 && (
          <button
            onClick={onBorrow}
            className="px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Pinjam
          </button>
        )}
      </div>
    </div>
  );
}
