import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKES } from "@/lib/currency";

// Placeholder data - will be fetched from API
const mockData = {
  totalIncome: 150000,
  totalExpenses: 85000,
  netSavings: 65000,
  budgetRemaining: 15000,
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Good morning! 👋</h1>
        <p className="text-muted-foreground">
          Here&apos;s your financial overview for February 2026
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatKES(mockData.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <span className="text-2xl">💸</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">
              {formatKES(mockData.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              -5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
            <span className="text-2xl">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatKES(mockData.netSavings)}
            </div>
            <p className="text-xs text-muted-foreground">
              43% savings rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Remaining</CardTitle>
            <span className="text-2xl">🎯</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatKES(mockData.budgetRemaining)}
            </div>
            <p className="text-xs text-muted-foreground">
              85% of budget used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Budget vs Actual */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Budget vs Actual</CardTitle>
            <CardDescription>
              Your spending progress by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Sample budget bars */}
              <BudgetBar category="Groceries" spent={12000} budget={15000} />
              <BudgetBar category="Transport" spent={8500} budget={10000} />
              <BudgetBar category="Entertainment" spent={7000} budget={5000} />
              <BudgetBar category="Utilities" spent={4000} budget={6000} />
              <BudgetBar category="Healthcare" spent={2000} budget={5000} />
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Bills */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Upcoming Bills</CardTitle>
            <CardDescription>
              Bills due in the next 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <BillItem name="Rent" amount={50000} daysUntil={3} />
              <BillItem name="KPLC Electricity" amount={3500} daysUntil={7} />
              <BillItem name="Internet" amount={4000} daysUntil={15} />
              <BillItem name="Water" amount={800} daysUntil={22} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Savings Goals */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your last 5 transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <TransactionItem 
                description="Naivas Supermarket" 
                category="Groceries" 
                amount={-2500} 
                date="Today" 
              />
              <TransactionItem 
                description="Uber" 
                category="Transport" 
                amount={-450} 
                date="Yesterday" 
              />
              <TransactionItem 
                description="Salary" 
                category="Income" 
                amount={150000} 
                date="Feb 1" 
              />
              <TransactionItem 
                description="Java House" 
                category="Dining" 
                amount={-1200} 
                date="Jan 30" 
              />
              <TransactionItem 
                description="M-Pesa Fee" 
                category="Other" 
                amount={-33} 
                date="Jan 30" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Savings Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Savings Goals</CardTitle>
            <CardDescription>
              Track your progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <GoalItem 
                name="Vacation Fund" 
                current={180000} 
                target={300000} 
                icon="🏖️" 
              />
              <GoalItem 
                name="Emergency Fund" 
                current={75000} 
                target={100000} 
                icon="🛡️" 
              />
              <GoalItem 
                name="New Car" 
                current={250000} 
                target={1000000} 
                icon="🚗" 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper Components
function BudgetBar({ 
  category, 
  spent, 
  budget 
}: { 
  category: string; 
  spent: number; 
  budget: number;
}) {
  const percentage = Math.min((spent / budget) * 100, 100);
  const status = percentage < 70 ? "safe" : percentage < 90 ? "warning" : "danger";
  const statusColor = {
    safe: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  }[status];

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{category}</span>
        <span className="text-muted-foreground">
          {formatKES(spent)} / {formatKES(budget)}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div 
          className={`h-full rounded-full ${statusColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function BillItem({ 
  name, 
  amount, 
  daysUntil 
}: { 
  name: string; 
  amount: number; 
  daysUntil: number;
}) {
  const urgency = daysUntil <= 3 ? "text-danger" : daysUntil <= 7 ? "text-warning" : "text-muted-foreground";
  
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">{name}</p>
        <p className={`text-sm ${urgency}`}>
          {daysUntil === 0 ? "Due today" : `Due in ${daysUntil} days`}
        </p>
      </div>
      <span className="font-semibold">{formatKES(amount)}</span>
    </div>
  );
}

function TransactionItem({ 
  description, 
  category, 
  amount, 
  date 
}: { 
  description: string; 
  category: string; 
  amount: number; 
  date: string;
}) {
  const isIncome = amount > 0;
  
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">{description}</p>
        <p className="text-sm text-muted-foreground">{category} • {date}</p>
      </div>
      <span className={isIncome ? "font-semibold text-success" : "font-semibold text-danger"}>
        {isIncome ? "+" : ""}{formatKES(Math.abs(amount))}
      </span>
    </div>
  );
}

function GoalItem({ 
  name, 
  current, 
  target, 
  icon 
}: { 
  name: string; 
  current: number; 
  target: number; 
  icon: string;
}) {
  const percentage = (current / target) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-medium">{name}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {percentage.toFixed(0)}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div 
          className="h-full rounded-full bg-primary"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {formatKES(current)} of {formatKES(target)}
      </p>
    </div>
  );
}
