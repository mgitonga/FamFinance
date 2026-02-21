"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatKES } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { deleteTransaction, type TransactionFilters, type TransactionWithDetails } from "./actions";
import {
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpCircle,
  ArrowDownCircle,
  Pencil,
  Trash2,
  Receipt,
  X,
} from "lucide-react";

type Category = {
  id: string;
  name: string;
  parent_id: string | null;
  color: string | null;
};

type Account = {
  id: string;
  name: string;
  type: string;
};

type TransactionsClientProps = {
  initialTransactions: TransactionWithDetails[];
  totalTransactions: number;
  currentPage: number;
  totalPages: number;
  categories: Category[];
  accounts: Account[];
  currentFilters: TransactionFilters;
};

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
];

export function TransactionsClient({
  initialTransactions,
  totalTransactions,
  currentPage,
  totalPages,
  categories,
  accounts,
  currentFilters,
}: TransactionsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState(currentFilters.search || "");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    startDate: currentFilters.startDate || "",
    endDate: currentFilters.endDate || "",
    categoryId: currentFilters.categoryId || "",
    accountId: currentFilters.accountId || "",
    type: currentFilters.type || "",
  });

  const updateUrl = (newFilters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    // Reset to page 1 when filters change
    if (!newFilters.page) {
      params.set("page", "1");
    }
    
    router.push(`/transactions?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ search: searchTerm });
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    updateUrl({
      startDate: filters.startDate,
      endDate: filters.endDate,
      categoryId: filters.categoryId,
      accountId: filters.accountId,
      type: filters.type,
    });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      categoryId: "",
      accountId: "",
      type: "",
    });
    setSearchTerm("");
    router.push("/transactions");
    setShowFilters(false);
  };

  const goToPage = (page: number) => {
    updateUrl({ page: page.toString() });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    setDeletingId(id);
    const formData = new FormData();
    formData.set("id", id);

    try {
      const result = await deleteTransaction(formData);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const hasActiveFilters =
    filters.startDate ||
    filters.endDate ||
    filters.categoryId ||
    filters.accountId ||
    filters.type ||
    searchTerm;

  return (
    <div className="space-y-4">
      {/* Search and Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by description or merchant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={hasActiveFilters ? "border-primary text-primary" : ""}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                Active
              </span>
            )}
          </Button>
          <Link href="/transactions/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Start Date</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">End Date</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <select
                  value={filters.categoryId}
                  onChange={(e) => handleFilterChange("categoryId", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.parent_id ? "  └ " : ""}{cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Account</label>
                <select
                  value={filters.accountId}
                  onChange={(e) => handleFilterChange("accountId", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Accounts</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear All
              </Button>
              <Button onClick={applyFilters}>Apply Filters</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {initialTransactions.length} of {totalTransactions} transactions
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {initialTransactions.map((transaction) => (
          <Card key={transaction.id} className="hover:bg-muted/50 transition-colors">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div
                  className={`rounded-full p-2 ${
                    transaction.type === "income"
                      ? "bg-success/10 text-success"
                      : "bg-danger/10 text-danger"
                  }`}
                >
                  {transaction.type === "income" ? (
                    <ArrowUpCircle className="h-5 w-5" />
                  ) : (
                    <ArrowDownCircle className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {transaction.description || transaction.merchant || transaction.category?.name || "Transaction"}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatDate(transaction.date)}</span>
                    <span>•</span>
                    <span
                      className="inline-flex items-center gap-1"
                      style={{ color: transaction.category?.color || undefined }}
                    >
                      {transaction.category?.name}
                    </span>
                    <span>•</span>
                    <span>{transaction.account?.name}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      transaction.type === "income" ? "text-success" : "text-danger"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatKES(transaction.amount)}
                  </p>
                  {transaction.receipt_url && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                      <Receipt className="h-3 w-3" />
                      Receipt
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Link href={`/transactions/${transaction.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(transaction.id)}
                    disabled={deletingId === transaction.id}
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {initialTransactions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              {hasActiveFilters
                ? "No transactions match your filters"
                : "No transactions yet. Add your first transaction to start tracking."}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Link href="/transactions/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transaction
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
