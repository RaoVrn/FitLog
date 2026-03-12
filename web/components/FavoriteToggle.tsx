import { memo } from "react";
import { Star } from "lucide-react";

interface FavoriteToggleProps {
  foodId: string;
  favorite: boolean;
  onToggle: (foodId: string, nextValue: boolean) => void;
}

const FavoriteToggle = memo(function FavoriteToggle({
  foodId,
  favorite,
  onToggle,
}: FavoriteToggleProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle(foodId, !favorite);
      }}
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
      className={`shrink-0 rounded-lg p-1.5 transition-all duration-150 hover:scale-110 active:scale-95 ${
        favorite ? "text-amber-500" : "text-slate-500 hover:text-amber-500"
      }`}
    >
      <Star className={`h-4 w-4 transition-colors ${favorite ? "fill-amber-500" : ""}`} />
    </button>
  );
});

export default FavoriteToggle;
