"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createCategory, updateCategory } from "./actions";

type Category = {
  id: string;
  name: string;
  type: string;
  parent_id: string | null;
  icon: string | null;
  color: string | null;
};

type CategoryFormProps = {
  category?: Category | null;
  parentCategories?: Category[];
  onSuccess?: () => void;
  onCancel?: () => void;
};

const CATEGORY_TYPES = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "both", label: "Both" },
];

const PRESET_COLORS = [
  "#22C55E", // Green
  "#3B82F6", // Blue
  "#F97316", // Orange
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#EAB308", // Yellow
  "#14B8A6", // Teal
  "#6366F1", // Indigo
  "#78716C", // Stone
];

const ICONS = [
  "shopping-cart", "utensils", "home", "car", "zap", "film", "heart-pulse",
  "baby", "dumbbell", "heart", "landmark", "trending-up", "briefcase",
  "wallet", "plus-circle", "more-horizontal",
];

export function CategoryForm({ category, parentCategories = [], onSuccess, onCancel }: CategoryFormProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(category?.color || PRESET_COLORS[0]);
  const isEditing = !!category;

  const handleSubmit = async (formData: FormData) => {
    setError("");
    setLoading(true);

    // Add color to form data
    formData.set("color", selectedColor);

    try {
      const result = isEditing
        ? await updateCategory(formData)
        : await createCategory(formData);

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        onSuccess?.();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Category" : "Add New Category"}</CardTitle>
      </CardHeader>
      <form action={handleSubmit}>
        {isEditing && <input type="hidden" name="id" value={category.id} />}
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-danger/10 p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" required>
              Category Name
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Food & Groceries"
              defaultValue={category?.name}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" required>
              Category Type
            </Label>
            <select
              id="type"
              name="type"
              defaultValue={category?.type || "expense"}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {CATEGORY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {!isEditing && parentCategories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="parentId">Parent Category (optional)</Label>
              <select
                id="parentId"
                name="parentId"
                defaultValue=""
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">None (top-level category)</option>
                {parentCategories
                  .filter((c) => !c.parent_id)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="icon">Icon</Label>
            <select
              id="icon"
              name="icon"
              defaultValue={category?.icon || ""}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select icon...</option>
              {ICONS.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    selectedColor === color
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
