"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryForm } from "./category-form";
import { deleteCategory } from "./actions";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Tag } from "lucide-react";

type Category = {
  id: string;
  name: string;
  type: string;
  parent_id: string | null;
  icon: string | null;
  color: string | null;
  children?: Category[];
};

type CategoriesClientProps = {
  initialCategories: Category[];
};

const TYPE_BADGES: Record<string, { label: string; className: string }> = {
  expense: { label: "Expense", className: "bg-danger/10 text-danger" },
  income: { label: "Income", className: "bg-success/10 text-success" },
  both: { label: "Both", className: "bg-primary/10 text-primary" },
};

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(initialCategories.map((c) => c.id))
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Flatten categories for parent dropdown
  const flatCategories = initialCategories.flatMap((c) => [
    c,
    ...(c.children || []),
  ]);

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCategory(null);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? This will also delete any sub-categories.")) {
      return;
    }

    setDeletingId(id);
    const formData = new FormData();
    formData.set("id", id);

    try {
      const result = await deleteCategory(formData);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategory = (category: Category, isChild = false) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const typeBadge = TYPE_BADGES[category.type] || TYPE_BADGES.expense;

    return (
      <div key={category.id}>
        <div
          className={`flex items-center justify-between py-3 px-4 ${
            isChild ? "pl-12 bg-muted/30" : ""
          } hover:bg-muted/50 transition-colors`}
        >
          <div className="flex items-center gap-3">
            {hasChildren && (
              <button
                type="button"
                onClick={() => toggleExpand(category.id)}
                className="p-1 hover:bg-muted rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            {!hasChildren && !isChild && <div className="w-6" />}
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: category.color || "#94A3B8" }}
            />
            <span className={isChild ? "text-sm" : "font-medium"}>
              {category.name}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${typeBadge.className}`}
            >
              {typeBadge.label}
            </span>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingCategory(category)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(category.id)}
              disabled={deletingId === category.id}
            >
              <Trash2 className="h-4 w-4 text-danger" />
            </Button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="border-l-2 border-muted ml-7">
            {category.children!.map((child) => renderCategory(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Form */}
      {(showForm || editingCategory) && (
        <CategoryForm
          category={editingCategory}
          parentCategories={flatCategories}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingCategory(null);
          }}
        />
      )}

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Categories</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {initialCategories.map((category) => renderCategory(category))}
          </div>
        </CardContent>
      </Card>

      {initialCategories.length === 0 && !showForm && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No categories yet. Categories are automatically created when you
              register.
            </p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
