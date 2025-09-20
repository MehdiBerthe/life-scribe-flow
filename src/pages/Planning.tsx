import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { storage, generateId, formatDate, isToday, getWeekStart } from '@/lib/storage';
import { DailyGoal, WeeklyReview } from '@/types';
import { Target, BarChart3, Plus, CheckCircle2, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Planning() {
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    summary: '',
    commitments: {
      Physical: '',
      Mental: '',
      Emotional: '',
      Spiritual: '',
      Social: '',
      Professional: '',
      Financial: ''
    }
  });

  useEffect(() => {
    const loadedGoals = storage.dailyGoals.getAll();
    const loadedReviews = storage.weeklyReviews.getAll();
    
    setGoals(loadedGoals.sort((a, b) => b.date.getTime() - a.date.getTime()));
    setReviews(loadedReviews.sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime()));
  }, []);

  const todayGoals = goals.filter(goal => isToday(goal.date));
  const completedToday = todayGoals.filter(goal => goal.done).length;

  const addGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;

    const goal: DailyGoal = {
      id: generateId(),
      date: new Date(),
      title: newGoal.trim(),
      done: false
    };

    const updatedGoals = [goal, ...goals];
    setGoals(updatedGoals);
    storage.dailyGoals.save(updatedGoals);
    setNewGoal('');
    
    toast({
      title: "Goal Added",
      description: `"${goal.title}" added to today's goals.`
    });
  };

  const toggleGoal = (goalId: string) => {
    const updatedGoals = goals.map(goal =>
      goal.id === goalId ? { ...goal, done: !goal.done } : goal
    );
    setGoals(updatedGoals);
    storage.dailyGoals.save(updatedGoals);
    
    const goal = goals.find(g => g.id === goalId);
    toast({
      title: goal?.done ? "Goal Unchecked" : "Goal Completed",
      description: `"${goal?.title}" ${goal?.done ? 'marked incomplete' : 'completed'}.`
    });
  };

  const addReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.summary.trim()) return;

    const review: WeeklyReview = {
      id: generateId(),
      weekStart: getWeekStart(new Date()),
      summary: reviewForm.summary.trim(),
      commitments: Object.fromEntries(
        Object.entries(reviewForm.commitments).filter(([_, value]) => value.trim())
      )
    };

    const updatedReviews = [review, ...reviews];
    setReviews(updatedReviews);
    storage.weeklyReviews.save(updatedReviews);
    
    setReviewForm({
      summary: '',
      commitments: {
        Physical: '',
        Mental: '',
        Emotional: '',
        Spiritual: '',
        Social: '',
        Professional: '',
        Financial: ''
      }
    });
    setShowReviewForm(false);
    
    toast({
      title: "Weekly Review Added",
      description: "Your reflection has been saved."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Target className="h-6 w-6 text-foreground" />
        <h1 className="text-3xl font-bold text-foreground">Planning</h1>
      </div>

      <Tabs defaultValue="goals" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target size={16} />
            Daily Goals
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-2">
            <BarChart3 size={16} />
            Weekly Review
          </TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="space-y-6">
          {/* Today's Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Today's Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-medium">
                  {completedToday} of {todayGoals.length} goals completed
                </span>
                <div className="text-sm text-muted-foreground">
                  {todayGoals.length > 0 ? Math.round((completedToday / todayGoals.length) * 100) : 0}% complete
                </div>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${todayGoals.length > 0 ? (completedToday / todayGoals.length) * 100 : 0}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Add New Goal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Today's Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addGoal} className="flex gap-2">
                <Input
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="What do you want to accomplish today?"
                  className="flex-1"
                />
                <Button type="submit" disabled={!newGoal.trim()}>
                  Add Goal
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Today's Goals */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayGoals.length > 0 ? (
                  todayGoals.map((goal) => (
                    <div key={goal.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Checkbox
                        checked={goal.done}
                        onCheckedChange={() => toggleGoal(goal.id)}
                      />
                      <span className={`flex-1 ${goal.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {goal.title}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Target size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No goals set for today</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Previous Goals */}
          {goals.filter(goal => !isToday(goal.date)).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Previous Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    goals
                      .filter(goal => !isToday(goal.date))
                      .slice(0, 10)
                      .reduce((acc, goal) => {
                        const dateKey = formatDate(goal.date);
                        if (!acc[dateKey]) acc[dateKey] = [];
                        acc[dateKey].push(goal);
                        return acc;
                      }, {} as Record<string, DailyGoal[]>)
                  ).map(([date, dayGoals]) => (
                    <div key={date} className="border-l-4 border-muted pl-4">
                      <h4 className="font-medium text-foreground mb-2">{date}</h4>
                      <div className="space-y-1">
                        {dayGoals.map((goal) => (
                          <div key={goal.id} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 
                              size={14} 
                              className={goal.done ? "text-success" : "text-muted-foreground"} 
                            />
                            <span className={goal.done ? "line-through text-muted-foreground" : "text-foreground"}>
                              {goal.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="review" className="space-y-6">
          {/* Add Review Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-foreground">Weekly Reviews</h2>
            <Button 
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              New Review
            </Button>
          </div>

          {/* Add Review Form */}
          {showReviewForm && (
            <Card>
              <CardHeader>
                <CardTitle>Weekly Review</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addReview} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Week Summary *</label>
                    <Textarea
                      value={reviewForm.summary}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, summary: e.target.value }))}
                      placeholder="Reflect on this week: wins, challenges, lessons learned..."
                      rows={4}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block">
                      Next Week's Commitments (optional)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(reviewForm.commitments).map(([area, value]) => (
                        <div key={area}>
                          <label className="text-sm text-muted-foreground">{area}</label>
                          <Input
                            value={value}
                            onChange={(e) => setReviewForm(prev => ({
                              ...prev,
                              commitments: { ...prev.commitments, [area]: e.target.value }
                            }))}
                            placeholder={`${area} commitment...`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">Save Review</Button>
                    <Button type="button" variant="outline" onClick={() => setShowReviewForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Previous Reviews */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <Card>
                <CardContent className="pt-12">
                  <div className="text-center">
                    <BarChart3 size={48} className="mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No weekly reviews yet</h3>
                    <p className="text-muted-foreground">Start reflecting on your week to build better habits.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              reviews.map((review) => (
                <Card key={review.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Week of {formatDate(review.weekStart)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Summary</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">{review.summary}</p>
                      </div>
                      
                      {review.commitments && Object.keys(review.commitments).length > 0 && (
                        <div>
                          <h4 className="font-medium text-foreground mb-2">Commitments</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {Object.entries(review.commitments).map(([area, commitment]) => (
                              <div key={area} className="text-sm">
                                <span className="font-medium text-foreground">{area}:</span>{' '}
                                <span className="text-muted-foreground">{commitment}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}