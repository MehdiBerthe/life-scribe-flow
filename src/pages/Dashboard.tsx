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
        <h1 className="text-4xl font-bold text-foreground mb-2">LifeOS Dashboard</h1>
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

      {/* Top 7 Priorities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Top 7 Priorities Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todayGoals.length > 0 ? (
              todayGoals.slice(0, 7).map((goal, index) => (
                <div key={goal.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {index + 1}
                  </span>
                  <CheckCircle2 
                    size={20} 
                    className={goal.done ? "text-success" : "text-muted-foreground"} 
                  />
                  <span className={`flex-1 ${goal.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {goal.title}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Target size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No priorities set for today</p>
                <Link to="/planning">
                  <Button variant="outline" className="mt-4">
                    Set Your Priorities
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Journal Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Recent Journal Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentEntries.length > 0 ? (
              recentEntries.map((entry) => (
                <div key={entry.id} className="p-4 rounded-lg bg-muted/30 border-l-4 border-primary">
                  <div className="flex items-center justify-between mb-2">
                    {entry.title && (
                      <h4 className="font-medium text-foreground">{entry.title}</h4>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {entry.content}
                  </p>
                  {entry.area && (
                    <span className="inline-block mt-2 px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                      {entry.area}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <PenTool size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No journal entries yet</p>
                <Link to="/journal">
                  <Button variant="outline" className="mt-4">
                    Start Writing
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}