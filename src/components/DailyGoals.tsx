import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { storage, generateId, formatDate, isToday } from '@/lib/storage';
import { DailyGoal } from '@/types';
import { Target, Plus, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { indexForRag } from '@/lib/rag';

export function DailyGoals() {
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [newGoal, setNewGoal] = useState('');

  useEffect(() => {
    const loadedGoals = storage.dailyGoals.getAll();
    setGoals(loadedGoals.sort((a, b) => b.date.getTime() - a.date.getTime()));
  }, []);

  const todayGoals = goals.filter(goal => isToday(goal.date));
  const completedToday = todayGoals.filter(goal => goal.done).length;

  const addGoal = async (e: React.FormEvent) => {
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

    // Index for RAG
    await indexForRag({
      userId: 'single-user',
      kind: 'goal_digest',
      refId: goal.id,
      title: `Daily Goal: ${goal.title}`,
      content: `Goal set: ${goal.title}`,
      metadata: {
        area: 'Professional',
        goal_status: 'created'
      }
    });
    
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

  return (
    <div className="space-y-6">
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
    </div>
  );
}