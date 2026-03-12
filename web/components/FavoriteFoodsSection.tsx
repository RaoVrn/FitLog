import { memo } from "react";
import { Star } from "lucide-react";
import { Food } from "@/types";
import FoodItem from "@/components/FoodItem";

interface FavoriteFoodsSectionProps {
  foods: Food[];
  onDelete?: (id: string) => void;
  onEdit?: (food: Food) => void;
  onToggleFavorite: (foodId: string, nextValue: boolean) => void;
}

const FavoriteFoodsSection = memo(function FavoriteFoodsSection({
  foods,
  onDelete,
  onEdit,
  onToggleFavorite,
}: FavoriteFoodsSectionProps) {
  if (foods.length === 0) return null;

  return (
    <section className="mb-3">
      <div className="mb-2 flex items-center gap-1.5">
        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-500/90">
          Favorite Foods
        </span>
        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400 ring-1 ring-amber-500/20">
          {foods.length}
        </span>
      </div>

      <div className="space-y-1.5">
        {foods.map((food) => (
          <FoodItem
            key={food.id}
            food={food}
            onDelete={onDelete}
            onEdit={onEdit}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </section>
  );
});

export default FavoriteFoodsSection;
