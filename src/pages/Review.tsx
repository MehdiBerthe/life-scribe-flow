import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { NotebookPage } from '@/components/NotebookPage';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { storage, generateId, formatDate, getWeekStart } from '@/lib/storage';
import { WeeklyReview, JournalEntry, DailyGoal, Transaction } from '@/types';
import { BarChart3, ChevronDown, ChevronRight, Plus, Calendar, Target, DollarSign, PenTool } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { indexForRag } from '@/lib/rag';

export default function Review() {
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardData, setWizardData] = useState({
    weekStart: getWeekStart(),
    summary: '',
    commitments: ''
  });
  const [weeklyData, setWeeklyData] = useState<{
    journals: JournalEntry[];
    goals: DailyGoal[];
    transactions: Transaction[];
  }>({ journals: [], goals: [], transactions: [] });

  useEffect(() => {
    const loadedReviews = storage.weeklyReviews.getAll();
    const sortedReviews = loadedReviews.sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
    setReviews(sortedReviews);
  }, []);

  const startWeeklyReview = () => {
    const weekStart = getWeekStart();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Load data from the past week
    const allJournals = storage.journal.getAll();
    const allGoals = storage.dailyGoals.getAll();
    const allTransactions = storage.transactions.getAll();

    const weekJournals = allJournals.filter(entry => 
      entry.createdAt >= weekStart && entry.createdAt < weekEnd
    );

    const weekGoals = allGoals.filter(goal => 
      goal.date >= weekStart && goal.date < weekEnd
    );

    const weekTransactions = allTransactions.filter(tx => 
      tx.date >= weekStart && tx.date < weekEnd
    );

    setWeeklyData({
      journals: weekJournals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      goals: weekGoals.sort((a, b) => b.date.getTime() - a.date.getTime()),
      transactions: weekTransactions.sort((a, b) => b.date.getTime() - a.date.getTime())
    });

    setWizardData({
      weekStart,
      summary: '',
      commitments: ''
    });

    setShowWizard(true);
  };

  const saveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wizardData.summary.trim()) {
      toast({
        title: "Summary Required",
        description: "Please add a summary of your week.",
        variant: "destructive"
      });
      return;
    }

    const newReview: WeeklyReview = {
      id: generateId(),
      weekStart: wizardData.weekStart,
      summary: wizardData.summary.trim(),
      commitments: wizardData.commitments.trim() ? 
        JSON.parse(wizardData.commitments.trim()) : undefined
    };

    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    storage.weeklyReviews.save(updatedReviews);

    // Index for RAG
    await indexForRag({
      userId: 'single-user',
      kind: 'reflection',
      refId: newReview.id,
      title: `Weekly Review - ${formatDate(newReview.weekStart)}`,
      content: `Summary: ${newReview.summary}${newReview.commitments ? `\n\nCommitments: ${JSON.stringify(newReview.commitments)}` : ''}`,
      metadata: {
        week_start: newReview.weekStart.toISOString(),
        review_type: 'weekly'
      }
    });

    setShowWizard(false);
    setWizardData({ weekStart: getWeekStart(), summary: '', commitments: '' });
    
    toast({
      title: "Review Saved",
      description: "Your weekly review has been saved."
    });
  };

  const formatWeekRange = (weekStart: Date): string => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
  };

  const parseCommitments = (commitments?: Record<string, string>) => {
    if (!commitments) return null;
    return Object.entries(commitments).map(([key, value]) => ({ key, value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-ink" />
          <h1 className="text-3xl font-bold text-ink">Weekly Review</h1>
        </div>
        <Button 
          onClick={startWeeklyReview}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Start Review
        </Button>
      </div>

      {/* Weekly Review Wizard */}
      {showWizard && (
        <div className="space-y-6">
          <NotebookPage>
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader>
                <CardTitle className="text-ink">
                  Weekly Review: {formatWeekRange(wizardData.weekStart)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Review your past week's activities and set commitments for the upcoming week.
                </p>
                
                {/* Week Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <PenTool className="h-6 w-6 mx-auto text-primary mb-2" />
                    <div className="text-2xl font-bold text-ink">{weeklyData.journals.length}</div>
                    <div className="text-sm text-muted-foreground">Journal Entries</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <Target className="h-6 w-6 mx-auto text-primary mb-2" />
                    <div className="text-2xl font-bold text-ink">
                      {weeklyData.goals.filter(g => g.done).length}/{weeklyData.goals.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Goals Completed</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <DollarSign className="h-6 w-6 mx-auto text-primary mb-2" />
                    <div className="text-2xl font-bold text-ink">{weeklyData.transactions.length}</div>
                    <div className="text-sm text-muted-foreground">Transactions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </NotebookPage>

          {/* Weekly Data Review */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Journal Entries */}
            <NotebookPage showLines>
              <Card className="border-0 bg-transparent shadow-none">
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="hover:bg-muted/20 transition-colors">
                      <CardTitle className="flex items-center justify-between text-ink">
                        <div className="flex items-center gap-2">
                          <PenTool size={18} />
                          Journal Entries ({weeklyData.journals.length})
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="max-h-64 overflow-y-auto">
                      {weeklyData.journals.length === 0 ? (
                        <p className="text-muted-foreground italic">No journal entries this week</p>
                      ) : (
                        <div className="space-y-3">
                          {weeklyData.journals.map(entry => (
                            <div key={entry.id} className="text-sm">
                              <div className="font-medium text-ink">
                                {entry.title || 'Untitled'}
                                {entry.area && (
                                  <span className="ml-2 text-xs bg-muted px-2 py-1 rounded">
                                    {entry.area}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mb-1">
                                {formatDate(entry.createdAt)}
                              </div>
                              <p className="text-muted-foreground line-clamp-2">
                                {entry.content.substring(0, 100)}...
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </NotebookPage>

            {/* Goals */}
            <NotebookPage showLines>
              <Card className="border-0 bg-transparent shadow-none">
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="hover:bg-muted/20 transition-colors">
                      <CardTitle className="flex items-center justify-between text-ink">
                        <div className="flex items-center gap-2">
                          <Target size={18} />
                          Goals ({weeklyData.goals.length})
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="max-h-64 overflow-y-auto">
                      {weeklyData.goals.length === 0 ? (
                        <p className="text-muted-foreground italic">No goals set this week</p>
                      ) : (
                        <div className="space-y-2">
                          {weeklyData.goals.map(goal => (
                            <div key={goal.id} className="flex items-center gap-2 text-sm">
                              <div className={`w-2 h-2 rounded-full ${
                                goal.done ? 'bg-success' : 'bg-muted-foreground'
                              }`} />
                              <span className={goal.done ? 'line-through text-muted-foreground' : 'text-ink'}>
                                {goal.title}
                              </span>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {formatDate(goal.date)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </NotebookPage>

            {/* Transactions */}
            <NotebookPage showLines>
              <Card className="border-0 bg-transparent shadow-none">
                <Collapsible>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="hover:bg-muted/20 transition-colors">
                      <CardTitle className="flex items-center justify-between text-ink">
                        <div className="flex items-center gap-2">
                          <DollarSign size={18} />
                          Transactions ({weeklyData.transactions.length})
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="max-h-64 overflow-y-auto">
                      {weeklyData.transactions.length === 0 ? (
                        <p className="text-muted-foreground italic">No transactions this week</p>
                      ) : (
                        <div className="space-y-2">
                          {weeklyData.transactions.map(tx => (
                            <div key={tx.id} className="flex items-center justify-between text-sm">
                              <div>
                                <span className={`font-medium ${
                                  tx.amount > 0 ? 'text-success' : 'text-destructive'
                                }`}>
                                  {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount)}
                                </span>
                                {tx.category && (
                                  <span className="ml-2 text-muted-foreground">
                                    {tx.category}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(tx.date)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </NotebookPage>
          </div>

          {/* Review Form */}
          <NotebookPage showLines>
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader>
                <CardTitle className="text-ink">Weekly Reflection</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={saveReview} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-ink">
                      Week Summary *
                    </label>
                    <Textarea
                      value={wizardData.summary}
                      onChange={(e) => setWizardData(prev => ({ ...prev, summary: e.target.value }))}
                      placeholder="How was your week? What went well? What could be improved?"
                      rows={4}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-ink">
                      Next Week Commitments (JSON format, optional)
                    </label>
                    <Textarea
                      value={wizardData.commitments}
                      onChange={(e) => setWizardData(prev => ({ ...prev, commitments: e.target.value }))}
                      placeholder={`{
  "spiritual": "10m meditation daily",
  "physical": "3 workouts this week",
  "professional": "Complete project milestone"
}`}
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional: JSON object with your commitments for next week
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">Save Review</Button>
                    <Button type="button" variant="outline" onClick={() => setShowWizard(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </NotebookPage>
        </div>
      )}

      {/* Past Reviews */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ink">Past Reviews</h2>
        
        {reviews.length === 0 ? (
          <NotebookPage showLines>
            <div className="text-center py-12">
              <BarChart3 size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-ink mb-2">No reviews yet</h3>
              <p className="text-muted-foreground">Start your first weekly review to track your progress.</p>
            </div>
          </NotebookPage>
        ) : (
          reviews.map((review) => (
            <NotebookPage key={review.id} showLines>
              <Card className="border-0 bg-transparent shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-ink">
                    <Calendar size={18} />
                    Week of {formatWeekRange(review.weekStart)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-ink whitespace-pre-wrap leading-relaxed">
                      {review.summary}
                    </p>
                  </div>
                  
                  {review.commitments && (
                    <div className="mt-4 pt-4 border-t border-notebook-lines">
                      <h4 className="text-sm font-medium text-ink mb-2">Week Commitments:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {parseCommitments(review.commitments)?.map(({ key, value }) => (
                          <div key={key} className="text-sm">
                            <span className="capitalize font-medium text-accent">{key}:</span>
                            <span className="ml-2 text-ink">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </NotebookPage>
          ))
        )}
      </div>
    </div>
  );
}