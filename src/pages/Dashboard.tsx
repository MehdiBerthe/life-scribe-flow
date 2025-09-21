import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { NotebookPage } from '@/components/NotebookPage';
import AICopilot from '@/components/AICopilot';
import { useVectorization } from '@/hooks/useVectorization';
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
  CheckCircle2,
  Brain,
  Database,
  RefreshCw
} from 'lucide-react';

export default function Dashboard() {
  const [todayGoals, setTodayGoals] = useState<DailyGoal[]>([]);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const { vectorizeAllData, vectorizeContacts, isVectorizing, progress } = useVectorization();

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
        <h1 className="text-4xl font-bold text-foreground mb-2">LifeX</h1>
        <p className="text-muted-foreground">Your AI-powered life operating system</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="copilot" className="flex items-center gap-2">
            <Brain size={16} />
            AI Co-Pilot
          </TabsTrigger>
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Database size={16} />
            Data Setup
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-8 mt-6">

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
        </TabsContent>
        
        <TabsContent value="copilot" className="mt-6">
          <AICopilot />
        </TabsContent>
        
        <TabsContent value="setup" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Vectorization
              </CardTitle>
              <CardDescription>
                Process your data to enable AI semantic search and intelligent insights.
                This creates embeddings of your journal entries, contacts, goals, and other data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isVectorizing ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{progress.type}</span>
                    <span>{progress.current}/{progress.total}</span>
                  </div>
                  <Progress 
                    value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0} 
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button onClick={vectorizeAllData} className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Vectorize All Data
                  </Button>
                  <Button variant="outline" onClick={vectorizeContacts} className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Vectorize Contacts Only
                  </Button>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                <p>
                  <strong>First time?</strong> Click "Vectorize All Data" to process all your existing information.
                  This may take a few minutes depending on how much data you have.
                </p>
                <p className="mt-2">
                  <strong>Regular updates:</strong> The AI will automatically process new data as you add it,
                  but you can manually refresh if needed.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}