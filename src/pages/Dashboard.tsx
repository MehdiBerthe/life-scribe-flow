import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NotebookPage } from '@/components/NotebookPage';
import { storage, formatDate, isToday } from '@/lib/storage';
import { DailyGoal, JournalEntry, Transaction } from '@/types';
import { 
  PenTool, 
  BookOpen, 
  Target, 
  DollarSign, 
  Activity, 
  Users,
  BarChart3,
  CheckCircle2
} from 'lucide-react';

export default function Dashboard() {
  const [todayGoals, setTodayGoals] = useState<DailyGoal[]>([]);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Load today's goals
    const goals = storage.dailyGoals.getAll();
    const today = goals.filter(goal => isToday(goal.date));
    setTodayGoals(today);

    // Load recent journal entries
    const entries = storage.journal.getAll();
    const recent = entries
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 3);
    setRecentEntries(recent);

    // Load recent transactions
    const transactions = storage.transactions.getAll();
    const recentTx = transactions
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 3);
    setRecentTransactions(recentTx);
  }, []);

  const completedGoals = todayGoals.filter(goal => goal.done).length;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-ink mb-2">LifeOS Dashboard</h1>
        <p className="text-muted-foreground">Your minimal life operating system</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{completedGoals}/{todayGoals.length}</p>
                <p className="text-xs text-muted-foreground">Today's Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <PenTool className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{recentEntries.length}</p>
                <p className="text-xs text-muted-foreground">Recent Entries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{recentTransactions.length}</p>
                <p className="text-xs text-muted-foreground">Recent Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">7</p>
                <p className="text-xs text-muted-foreground">Life Areas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NotebookPage>
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-ink">
                <PenTool className="h-5 w-5" />
                Journal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Capture thoughts across 7 life areas
              </p>
              <Link to="/journal">
                <Button variant="outline" className="w-full">
                  Open Journal
                </Button>
              </Link>
            </CardContent>
          </Card>
        </NotebookPage>

        <NotebookPage>
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-ink">
                <BookOpen className="h-5 w-5" />
                Reading List
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Track books, notes, and learnings
              </p>
              <Link to="/reading">
                <Button variant="outline" className="w-full">
                  View Reading List
                </Button>
              </Link>
            </CardContent>
          </Card>
        </NotebookPage>

        <NotebookPage>
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-ink">
                <Target className="h-5 w-5" />
                Daily Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Top 7 priorities for today
              </p>
              <Link to="/goals">
                <Button variant="outline" className="w-full">
                  Manage Goals
                </Button>
              </Link>
            </CardContent>
          </Card>
        </NotebookPage>

        <NotebookPage>
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-ink">
                <BarChart3 className="h-5 w-5" />
                Weekly Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Reflect and plan ahead
              </p>
              <Link to="/review">
                <Button variant="outline" className="w-full">
                  Start Review
                </Button>
              </Link>
            </CardContent>
          </Card>
        </NotebookPage>

        <NotebookPage>
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-ink">
                <DollarSign className="h-5 w-5" />
                Finance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Track spending and budgets
              </p>
              <Link to="/finance">
                <Button variant="outline" className="w-full">
                  View Finances
                </Button>
              </Link>
            </CardContent>
          </Card>
        </NotebookPage>

        <NotebookPage>
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-ink">
                <Activity className="h-5 w-5" />
                Physical Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Health and wellness tracking
              </p>
              <Link to="/physical">
                <Button variant="outline" className="w-full">
                  Log Activity
                </Button>
              </Link>
            </CardContent>
          </Card>
        </NotebookPage>
      </div>

      {/* Today's Goals Preview */}
      {todayGoals.length > 0 && (
        <NotebookPage showLines>
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="text-ink">Today's Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {todayGoals.slice(0, 7).map((goal) => (
                  <div key={goal.id} className="flex items-center gap-2">
                    <CheckCircle2 
                      size={16} 
                      className={goal.done ? "text-success" : "text-muted-foreground"} 
                    />
                    <span className={goal.done ? "line-through text-muted-foreground" : "text-ink"}>
                      {goal.title}
                    </span>
                  </div>
                ))}
              </div>
              {todayGoals.length === 0 && (
                <p className="text-muted-foreground italic">No goals set for today</p>
              )}
            </CardContent>
          </Card>
        </NotebookPage>
      )}
    </div>
  );
}