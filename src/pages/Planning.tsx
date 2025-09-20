import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { storage, generateId, formatDate, isToday, getWeekStart } from '@/lib/storage';
import { DailyGoal, EndOfDayReview, WeeklyPlan, EndOfWeekReview, DAILY_CHECKLIST_SIMPLIFIED, WEEKLY_CHECKLIST } from '@/types';
import { Target, BarChart3, Plus, CheckCircle2, Calendar, Moon, Star, List, CheckSquare } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Planning() {
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [endOfDayReviews, setEndOfDayReviews] = useState<EndOfDayReview[]>([]);
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([]);
  const [endOfWeekReviews, setEndOfWeekReviews] = useState<EndOfWeekReview[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [newPriority, setNewPriority] = useState('');
  const [showDayReviewForm, setShowDayReviewForm] = useState(false);
  const [showEndWeekReviewForm, setShowEndWeekReviewForm] = useState(false);
  
  const [dayReviewForm, setDayReviewForm] = useState({
    wentWell: '',
    couldImprove: '',
    keyAccomplishments: '',
    lessonsLearned: '',
    tomorrowsFocus: '',
    mood: [3] as number[],
    energyLevel: [3] as number[],
    gratitude: '',
    dailyChecklist: {} as Record<string, boolean>,
  });

  const [endWeekReviewForm, setEndWeekReviewForm] = useState({
    accomplishments: '',
    challenges: '',
    lessonsLearned: '',
    nextWeekFocus: '',
    overallSatisfaction: [3] as number[],
    prioritiesCompleted: [0] as number[],
    weeklyChecklist: {} as Record<string, boolean>,
  });

  useEffect(() => {
    const loadedGoals = storage.dailyGoals.getAll();
    const loadedDayReviews = storage.endOfDayReviews.getAll();
    const loadedWeeklyPlans = storage.weeklyPlans.getAll();
    const loadedEndWeekReviews = storage.endOfWeekReviews.getAll();
    
    setGoals(loadedGoals.sort((a, b) => b.date.getTime() - a.date.getTime()));
    setEndOfDayReviews(loadedDayReviews.sort((a, b) => b.date.getTime() - a.date.getTime()));
    setWeeklyPlans(loadedWeeklyPlans.sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime()));
    setEndOfWeekReviews(loadedEndWeekReviews.sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime()));
  }, []);

  // Initialize checklists when forms open
  useEffect(() => {
    if (showDayReviewForm) {
      const initialDailyChecklist = {} as Record<string, boolean>;
      DAILY_CHECKLIST_SIMPLIFIED.forEach(item => {
        initialDailyChecklist[item] = false;
      });
      setDayReviewForm(prev => ({ ...prev, dailyChecklist: initialDailyChecklist }));
    }
  }, [showDayReviewForm]);

  useEffect(() => {
    if (showEndWeekReviewForm) {
      const initialWeeklyChecklist = {} as Record<string, boolean>;
      WEEKLY_CHECKLIST.forEach(item => {
        initialWeeklyChecklist[item] = false;
      });
      setEndWeekReviewForm(prev => ({ ...prev, weeklyChecklist: initialWeeklyChecklist }));
    }
  }, [showEndWeekReviewForm]);

  const todayGoals = goals.filter(goal => isToday(goal.date));
  const completedToday = todayGoals.filter(goal => goal.done).length;
  
  const currentWeekStart = getWeekStart(new Date());
  const currentWeekPlan = weeklyPlans.find(plan => 
    plan.weekStart.getTime() === currentWeekStart.getTime()
  );

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


  const addDayReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dayReviewForm.wentWell.trim() || !dayReviewForm.couldImprove.trim()) {
      toast({
        title: "Error",
        description: "Please fill in what went well and what could improve.",
        variant: "destructive"
      });
      return;
    }

    const review: EndOfDayReview = {
      id: generateId(),
      date: new Date(),
      wentWell: dayReviewForm.wentWell.trim(),
      couldImprove: dayReviewForm.couldImprove.trim(),
      keyAccomplishments: dayReviewForm.keyAccomplishments.trim() || undefined,
      lessonsLearned: dayReviewForm.lessonsLearned.trim() || undefined,
      tomorrowsFocus: dayReviewForm.tomorrowsFocus.trim() || undefined,
      mood: dayReviewForm.mood[0] as 1 | 2 | 3 | 4 | 5,
      energyLevel: dayReviewForm.energyLevel[0] as 1 | 2 | 3 | 4 | 5,
      gratitude: dayReviewForm.gratitude.trim() || undefined,
      dailyChecklist: dayReviewForm.dailyChecklist,
      createdAt: new Date(),
    };

    const updatedReviews = [review, ...endOfDayReviews];
    setEndOfDayReviews(updatedReviews);
    storage.endOfDayReviews.save(updatedReviews);
    
    setDayReviewForm({
      wentWell: '',
      couldImprove: '',
      keyAccomplishments: '',
      lessonsLearned: '',
      tomorrowsFocus: '',
      mood: [3],
      energyLevel: [3],
      gratitude: '',
      dailyChecklist: {},
    });
    setShowDayReviewForm(false);
    
    toast({
      title: "Day Review Added",
      description: "Your daily reflection has been saved."
    });
  };

  const addPriority = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPriority.trim()) return;

    const weekStart = currentWeekStart;
    let plan = currentWeekPlan;

    if (!plan) {
      plan = {
        id: generateId(),
        weekStart,
        priorities: [newPriority.trim()],
        createdAt: new Date(),
      };
      const updatedPlans = [plan, ...weeklyPlans];
      setWeeklyPlans(updatedPlans);
      storage.weeklyPlans.save(updatedPlans);
    } else {
      if (plan.priorities.length >= 7) {
        toast({
          title: "Maximum Priorities Reached",
          description: "You can only have 7 priorities per week.",
          variant: "destructive"
        });
        return;
      }
      
      const updatedPlan = {
        ...plan,
        priorities: [...plan.priorities, newPriority.trim()]
      };
      const updatedPlans = weeklyPlans.map(p => p.id === plan.id ? updatedPlan : p);
      setWeeklyPlans(updatedPlans);
      storage.weeklyPlans.save(updatedPlans);
    }

    setNewPriority('');
    toast({
      title: "Priority Added",
      description: `"${newPriority.trim()}" added to this week's priorities.`
    });
  };

  const removePriority = (priorityIndex: number) => {
    if (!currentWeekPlan) return;

    const updatedPlan = {
      ...currentWeekPlan,
      priorities: currentWeekPlan.priorities.filter((_, index) => index !== priorityIndex)
    };
    const updatedPlans = weeklyPlans.map(p => p.id === currentWeekPlan.id ? updatedPlan : p);
    setWeeklyPlans(updatedPlans);
    storage.weeklyPlans.save(updatedPlans);

    toast({
      title: "Priority Removed",
      description: "Priority has been removed from this week."
    });
  };

  const addEndWeekReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!endWeekReviewForm.accomplishments.trim() || !endWeekReviewForm.challenges.trim()) {
      toast({
        title: "Error",
        description: "Please fill in accomplishments and challenges.",
        variant: "destructive"
      });
      return;
    }

    const review: EndOfWeekReview = {
      id: generateId(),
      weekStart: getWeekStart(new Date()),
      accomplishments: endWeekReviewForm.accomplishments.trim(),
      challenges: endWeekReviewForm.challenges.trim(),
      lessonsLearned: endWeekReviewForm.lessonsLearned.trim() || undefined,
      nextWeekFocus: endWeekReviewForm.nextWeekFocus.trim() || undefined,
      overallSatisfaction: endWeekReviewForm.overallSatisfaction[0] as 1 | 2 | 3 | 4 | 5,
      prioritiesCompleted: endWeekReviewForm.prioritiesCompleted[0],
      weeklyChecklist: endWeekReviewForm.weeklyChecklist,
      createdAt: new Date(),
    };

    const updatedReviews = [review, ...endOfWeekReviews];
    setEndOfWeekReviews(updatedReviews);
    storage.endOfWeekReviews.save(updatedReviews);
    
    setEndWeekReviewForm({
      accomplishments: '',
      challenges: '',
      lessonsLearned: '',
      nextWeekFocus: '',
      overallSatisfaction: [3],
      prioritiesCompleted: [0],
      weeklyChecklist: {},
    });
    setShowEndWeekReviewForm(false);
    
    toast({
      title: "End of Week Review Added",
      description: "Your weekly reflection has been saved."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Target className="h-6 w-6 text-foreground" />
        <h1 className="text-3xl font-bold text-foreground">Planning</h1>
      </div>

      <Tabs defaultValue="goals" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target size={16} />
            Daily Goals
          </TabsTrigger>
          <TabsTrigger value="weekly-plan" className="flex items-center gap-2">
            <List size={16} />
            Weekly Plan
          </TabsTrigger>
          <TabsTrigger value="day-review" className="flex items-center gap-2">
            <Moon size={16} />
            End of Day
          </TabsTrigger>
          <TabsTrigger value="end-week-review" className="flex items-center gap-2">
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

        <TabsContent value="weekly-plan" className="space-y-6">
          {/* Current Week Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                This Week's Priorities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-medium">
                  Week of {formatDate(currentWeekStart)}
                </span>
                <div className="text-sm text-muted-foreground">
                  {currentWeekPlan ? `${currentWeekPlan.priorities.length}/7 priorities set` : '0/7 priorities set'}
                </div>
              </div>
              
              {/* Add Priority Form */}
              {(!currentWeekPlan || currentWeekPlan.priorities.length < 7) && (
                <form onSubmit={addPriority} className="flex gap-2 mb-4">
                  <Input
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    placeholder="Add a priority for this week..."
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!newPriority.trim()}>
                    Add Priority
                  </Button>
                </form>
              )}

              {/* Current Priorities */}
              <div className="space-y-2">
                {currentWeekPlan?.priorities.map((priority, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-foreground">{priority}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePriority(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                )) ?? (
                  <div className="text-center py-8">
                    <List size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No priorities set for this week</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Previous Week Plans */}
          {weeklyPlans.filter(plan => plan.weekStart.getTime() !== currentWeekStart.getTime()).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Previous Week Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weeklyPlans
                    .filter(plan => plan.weekStart.getTime() !== currentWeekStart.getTime())
                    .slice(0, 5)
                    .map((plan) => (
                      <div key={plan.id} className="border-l-4 border-muted pl-4">
                        <h4 className="font-medium text-foreground mb-2">Week of {formatDate(plan.weekStart)}</h4>
                        <div className="space-y-1">
                          {plan.priorities.map((priority, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-muted text-muted-foreground text-xs font-medium flex items-center justify-center">
                                {index + 1}
                              </span>
                              <span className="text-foreground">{priority}</span>
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

        <TabsContent value="day-review" className="space-y-6">
          {/* Add Day Review Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-foreground">End of Day Reviews</h2>
            <Button 
              onClick={() => setShowDayReviewForm(!showDayReviewForm)}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              New Day Review
            </Button>
          </div>

          {/* Add Day Review Form */}
          {showDayReviewForm && (
            <Card>
              <CardHeader>
                <CardTitle>End of Day Review</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addDayReview} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">What went well today? *</label>
                      <Textarea
                        value={dayReviewForm.wentWell}
                        onChange={(e) => setDayReviewForm(prev => ({ ...prev, wentWell: e.target.value }))}
                        placeholder="Celebrate your wins, big and small..."
                        rows={3}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">What could have been better? *</label>
                      <Textarea
                        value={dayReviewForm.couldImprove}
                        onChange={(e) => setDayReviewForm(prev => ({ ...prev, couldImprove: e.target.value }))}
                        placeholder="Areas for improvement..."
                        rows={3}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Key Accomplishments</label>
                    <Textarea
                      value={dayReviewForm.keyAccomplishments}
                      onChange={(e) => setDayReviewForm(prev => ({ ...prev, keyAccomplishments: e.target.value }))}
                      placeholder="What did you accomplish today?"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Lessons Learned</label>
                    <Textarea
                      value={dayReviewForm.lessonsLearned}
                      onChange={(e) => setDayReviewForm(prev => ({ ...prev, lessonsLearned: e.target.value }))}
                      placeholder="What did you learn today?"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Tomorrow's Focus</label>
                    <Textarea
                      value={dayReviewForm.tomorrowsFocus}
                      onChange={(e) => setDayReviewForm(prev => ({ ...prev, tomorrowsFocus: e.target.value }))}
                      placeholder="What are your priorities for tomorrow?"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-3 block">
                        Mood (1-5): {dayReviewForm.mood[0]}
                      </label>
                      <Slider
                        value={dayReviewForm.mood}
                        onValueChange={(value) => setDayReviewForm(prev => ({ ...prev, mood: value }))}
                        max={5}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>😞 Poor</span>
                        <span>😐 Okay</span>
                        <span>😊 Great</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-3 block">
                        Energy Level (1-5): {dayReviewForm.energyLevel[0]}
                      </label>
                      <Slider
                        value={dayReviewForm.energyLevel}
                        onValueChange={(value) => setDayReviewForm(prev => ({ ...prev, energyLevel: value }))}
                        max={5}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>🔋 Low</span>
                        <span>⚡ Medium</span>
                        <span>🚀 High</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Gratitude</label>
                    <Textarea
                      value={dayReviewForm.gratitude}
                      onChange={(e) => setDayReviewForm(prev => ({ ...prev, gratitude: e.target.value }))}
                      placeholder="What are you grateful for today?"
                      rows={2}
                    />
                  </div>

                  {/* Daily Checklist */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block">Daily Checklist</label>
                    <div className="space-y-2 max-h-64 overflow-y-auto bg-muted/20 p-4 rounded-lg">
                      {DAILY_CHECKLIST_SIMPLIFIED.map((item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <Checkbox
                            id={`daily-${index}`}
                            checked={dayReviewForm.dailyChecklist[item] || false}
                            onCheckedChange={(checked) => 
                              setDayReviewForm(prev => ({
                                ...prev,
                                dailyChecklist: {
                                  ...prev.dailyChecklist,
                                  [item]: checked === true
                                }
                              }))
                            }
                          />
                          <label htmlFor={`daily-${index}`} className="text-sm text-foreground leading-5 cursor-pointer">
                            {item}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">Save Day Review</Button>
                    <Button type="button" variant="outline" onClick={() => setShowDayReviewForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Previous Day Reviews */}
          <div className="space-y-4">
            {endOfDayReviews.length === 0 ? (
              <Card>
                <CardContent className="pt-12">
                  <div className="text-center">
                    <Moon size={48} className="mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No day reviews yet</h3>
                    <p className="text-muted-foreground">Start reflecting on your day to build self-awareness.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              endOfDayReviews.slice(0, 10).map((review) => (
                <Card key={review.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {formatDate(review.date)}
                      <div className="flex items-center gap-4 ml-auto">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>😊 {review.mood}/5</span>
                          <span>⚡ {review.energyLevel}/5</span>
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-foreground mb-2">✅ What went well</h4>
                          <p className="text-sm text-muted-foreground">{review.wentWell}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground mb-2">🔄 Could improve</h4>
                          <p className="text-sm text-muted-foreground">{review.couldImprove}</p>
                        </div>
                      </div>
                      
                      {review.keyAccomplishments && (
                        <div>
                          <h4 className="font-medium text-foreground mb-2">🏆 Key Accomplishments</h4>
                          <p className="text-sm text-muted-foreground">{review.keyAccomplishments}</p>
                        </div>
                      )}
                      
                      {review.lessonsLearned && (
                        <div>
                          <h4 className="font-medium text-foreground mb-2">💡 Lessons Learned</h4>
                          <p className="text-sm text-muted-foreground">{review.lessonsLearned}</p>
                        </div>
                      )}
                      
                      {review.tomorrowsFocus && (
                        <div>
                          <h4 className="font-medium text-foreground mb-2">🎯 Tomorrow's Focus</h4>
                          <p className="text-sm text-muted-foreground">{review.tomorrowsFocus}</p>
                        </div>
                      )}
                      
                      {review.gratitude && (
                        <div>
                          <h4 className="font-medium text-foreground mb-2">🙏 Gratitude</h4>
                          <p className="text-sm text-muted-foreground">{review.gratitude}</p>
                        </div>
                      )}
                      
                      {review.dailyChecklist && Object.keys(review.dailyChecklist).length > 0 && (
                        <div>
                          <h4 className="font-medium text-foreground mb-2">✅ Daily Checklist</h4>
                          <div className="grid grid-cols-1 gap-1 text-xs">
                            {Object.entries(review.dailyChecklist).map(([item, completed]) => (
                              <div key={item} className="flex items-center gap-2">
                                <span className={`w-4 h-4 rounded-sm flex items-center justify-center ${completed ? 'bg-success text-success-foreground' : 'bg-muted'}`}>
                                  {completed && '✓'}
                                </span>
                                <span className={completed ? 'text-foreground' : 'text-muted-foreground'}>
                                  {item}
                                </span>
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

        <TabsContent value="end-week-review" className="space-y-6">
          {/* Add End Week Review Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-foreground">End of Week Reviews</h2>
            <Button 
              onClick={() => setShowEndWeekReviewForm(!showEndWeekReviewForm)}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              New End of Week Review
            </Button>
          </div>

          {/* Add End Week Review Form */}
          {showEndWeekReviewForm && (
            <Card>
              <CardHeader>
                <CardTitle>End of Week Review</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addEndWeekReview} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">What did you accomplish this week? *</label>
                      <Textarea
                        value={endWeekReviewForm.accomplishments}
                        onChange={(e) => setEndWeekReviewForm(prev => ({ ...prev, accomplishments: e.target.value }))}
                        placeholder="List your key accomplishments and wins..."
                        rows={3}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">What were the main challenges? *</label>
                      <Textarea
                        value={endWeekReviewForm.challenges}
                        onChange={(e) => setEndWeekReviewForm(prev => ({ ...prev, challenges: e.target.value }))}
                        placeholder="What obstacles or difficulties did you face?"
                        rows={3}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Key Lessons Learned</label>
                    <Textarea
                      value={endWeekReviewForm.lessonsLearned}
                      onChange={(e) => setEndWeekReviewForm(prev => ({ ...prev, lessonsLearned: e.target.value }))}
                      placeholder="What insights or learnings did you gain?"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Next Week's Focus</label>
                    <Textarea
                      value={endWeekReviewForm.nextWeekFocus}
                      onChange={(e) => setEndWeekReviewForm(prev => ({ ...prev, nextWeekFocus: e.target.value }))}
                      placeholder="What will you focus on next week?"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-3 block">
                        Overall Satisfaction (1-5): {endWeekReviewForm.overallSatisfaction[0]}
                      </label>
                      <Slider
                        value={endWeekReviewForm.overallSatisfaction}
                        onValueChange={(value) => setEndWeekReviewForm(prev => ({ ...prev, overallSatisfaction: value }))}
                        max={5}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>😞 Poor</span>
                        <span>😐 Okay</span>
                        <span>😊 Excellent</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-3 block">
                        Priorities Completed: {endWeekReviewForm.prioritiesCompleted[0]}/{currentWeekPlan?.priorities.length || 0}
                      </label>
                      <Slider
                        value={endWeekReviewForm.prioritiesCompleted}
                        onValueChange={(value) => setEndWeekReviewForm(prev => ({ ...prev, prioritiesCompleted: value }))}
                        max={currentWeekPlan?.priorities.length || 7}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>None</span>
                        <span>Some</span>
                        <span>All</span>
                      </div>
                    </div>
                  </div>

                  {/* Weekly Checklist */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block">Weekly Checklist</label>
                    <div className="space-y-2 bg-muted/20 p-4 rounded-lg">
                      {WEEKLY_CHECKLIST.map((item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <Checkbox
                            id={`weekly-${index}`}
                            checked={endWeekReviewForm.weeklyChecklist[item] || false}
                            onCheckedChange={(checked) => 
                              setEndWeekReviewForm(prev => ({
                                ...prev,
                                weeklyChecklist: {
                                  ...prev.weeklyChecklist,
                                  [item]: checked === true
                                }
                              }))
                            }
                          />
                          <label htmlFor={`weekly-${index}`} className="text-sm text-foreground leading-5 cursor-pointer">
                            {item}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weekly Reporting */}
                  <div className="bg-muted/20 p-4 rounded-lg space-y-2">
                    <h4 className="text-sm font-medium text-foreground mb-2">Weekly Reporting Questions</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• What did I accomplish this Week ?</p>
                      <p>• What are my goals for next Week ?</p>
                      <p>• What are the challenges I am facing ?</p>
                      <p>• What are the solutions to these challenges ?</p>
                    </div>
                    <p className="text-xs text-muted-foreground italic">Consider these questions when filling out the sections above.</p>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">Save Week Review</Button>
                    <Button type="button" variant="outline" onClick={() => setShowEndWeekReviewForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Previous End of Week Reviews */}
          <div className="space-y-4">
            {endOfWeekReviews.length === 0 ? (
              <Card>
                <CardContent className="pt-12">
                  <div className="text-center">
                    <CheckSquare size={48} className="mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No end of week reviews yet</h3>
                    <p className="text-muted-foreground">Start reviewing your weekly progress and learnings.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              endOfWeekReviews.slice(0, 10).map((review) => (
                <Card key={review.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Week of {formatDate(review.weekStart)}</span>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Satisfaction: {review.overallSatisfaction}/5</span>
                        <span>Completed: {review.prioritiesCompleted}</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Accomplishments</h4>
                        <p className="text-sm text-muted-foreground">{review.accomplishments}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Challenges</h4>
                        <p className="text-sm text-muted-foreground">{review.challenges}</p>
                      </div>
                    </div>
                    
                    {(review.lessonsLearned || review.nextWeekFocus) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                        {review.lessonsLearned && (
                          <div>
                            <h4 className="font-medium text-foreground mb-2">Lessons Learned</h4>
                            <p className="text-sm text-muted-foreground">{review.lessonsLearned}</p>
                          </div>
                        )}
                        {review.nextWeekFocus && (
                          <div>
                            <h4 className="font-medium text-foreground mb-2">Next Week Focus</h4>
                            <p className="text-sm text-muted-foreground">{review.nextWeekFocus}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {review.weeklyChecklist && Object.keys(review.weeklyChecklist).length > 0 && (
                      <div className="pt-4 border-t">
                        <h4 className="font-medium text-foreground mb-2">Weekly Checklist</h4>
                        <div className="grid grid-cols-1 gap-1 text-xs">
                          {Object.entries(review.weeklyChecklist).map(([item, completed]) => (
                            <div key={item} className="flex items-center gap-2">
                              <span className={`w-4 h-4 rounded-sm flex items-center justify-center ${completed ? 'bg-success text-success-foreground' : 'bg-muted'}`}>
                                {completed && '✓'}
                              </span>
                              <span className={completed ? 'text-foreground' : 'text-muted-foreground'}>
                                {item}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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