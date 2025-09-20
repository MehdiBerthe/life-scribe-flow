import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { NotebookPage } from '@/components/NotebookPage';
import { storage, generateId, formatDate, isToday } from '@/lib/storage';
import { DailyGoal } from '@/types';
import { Target, Plus, CheckCircle2, Circle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Goals() {
  const [todayGoals, setTodayGoals] = useState<DailyGoal[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');

  useEffect(() => {
    const goals = storage.dailyGoals.getAll();
    const today = goals.filter(goal => isToday(goal.date));
    setTodayGoals(today);
  }, []);

  const addGoal = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newGoalTitle.trim()) return;
    
    if (todayGoals.length >= 7) {
      toast({
        title: "Maximum Goals Reached",
        description: "You can only have 7 goals per day. Complete or remove existing goals first.",
        variant: "destructive"
      });
      return;
    }

    const newGoal: DailyGoal = {
      id: generateId(),
      date: new Date(),
      title: newGoalTitle.trim(),
      done: false
    };

    // Update all goals in storage
    const allGoals = storage.dailyGoals.getAll();
    const updatedGoals = [newGoal, ...allGoals];
    storage.dailyGoals.save(updatedGoals);
    
    // Update today's goals in state
    const updatedTodayGoals = [newGoal, ...todayGoals];
    setTodayGoals(updatedTodayGoals);
    
    setNewGoalTitle('');
    
    toast({
      title: "Goal Added",
      description: `"${newGoal.title}" added to today's goals.`
    });
  };

  const toggleGoal = (goalId: string) => {
    const allGoals = storage.dailyGoals.getAll();
    const updatedGoals = allGoals.map(goal => 
      goal.id === goalId ? { ...goal, done: !goal.done } : goal
    );
    
    storage.dailyGoals.save(updatedGoals);
    
    const updatedTodayGoals = todayGoals.map(goal =>
      goal.id === goalId ? { ...goal, done: !goal.done } : goal
    );
    setTodayGoals(updatedTodayGoals);

    const toggledGoal = updatedTodayGoals.find(g => g.id === goalId);
    if (toggledGoal) {
      toast({
        title: toggledGoal.done ? "Goal Completed! 🎉" : "Goal Reopened",
        description: `"${toggledGoal.title}" ${toggledGoal.done ? 'completed' : 'marked as incomplete'}.`
      });
    }
  };

  const removeGoal = (goalId: string) => {
    const allGoals = storage.dailyGoals.getAll();
    const updatedGoals = allGoals.filter(goal => goal.id !== goalId);
    storage.dailyGoals.save(updatedGoals);
    
    const updatedTodayGoals = todayGoals.filter(goal => goal.id !== goalId);
    setTodayGoals(updatedTodayGoals);
    
    toast({
      title: "Goal Removed",
      description: "Goal has been deleted."
    });
  };

  const completedCount = todayGoals.filter(goal => goal.done).length;
  const progressPercent = todayGoals.length > 0 ? (completedCount / todayGoals.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6 text-ink" />
          <h1 className="text-3xl font-bold text-ink">Daily Goals</h1>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-ink">{completedCount}/{todayGoals.length}</div>
          <div className="text-sm text-muted-foreground">{Math.round(progressPercent)}% Complete</div>
        </div>
      </div>

      {/* Add New Goal */}
      <NotebookPage showLines>
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader>
            <CardTitle className="text-ink">Add Today's Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addGoal} className="flex gap-2">
              <Input
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="What do you want to accomplish today?"
                className="flex-1"
                maxLength={100}
              />
              <Button type="submit" disabled={!newGoalTitle.trim() || todayGoals.length >= 7}>
                <Plus size={16} className="mr-1" />
                Add Goal
              </Button>
            </form>
            
            {todayGoals.length >= 7 && (
              <p className="text-sm text-muted-foreground mt-2">
                Maximum 7 goals per day. Complete or remove existing goals to add more.
              </p>
            )}
          </CardContent>
        </Card>
      </NotebookPage>

      {/* Today's Goals */}
      <NotebookPage showLines>
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader>
            <CardTitle className="text-ink">Today's Goals - {formatDate(new Date())}</CardTitle>
          </CardHeader>
          <CardContent>
            {todayGoals.length === 0 ? (
              <div className="text-center py-8">
                <Target size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-ink mb-2">No goals set for today</h3>
                <p className="text-muted-foreground">Add your first goal to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayGoals.map((goal, index) => (
                  <div key={goal.id} className="flex items-center gap-3 p-3 rounded-lg bg-card/50 hover:bg-card transition-colors">
                    <button
                      onClick={() => toggleGoal(goal.id)}
                      className="flex-shrink-0"
                    >
                      {goal.done ? (
                        <CheckCircle2 size={20} className="text-success" />
                      ) : (
                        <Circle size={20} className="text-muted-foreground hover:text-ink" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          #{index + 1}
                        </span>
                        <span 
                          className={`text-ink ${goal.done ? 'line-through opacity-60' : ''}`}
                        >
                          {goal.title}
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeGoal(goal.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </NotebookPage>

      {/* Progress Insight */}
      {todayGoals.length > 0 && (
        <NotebookPage>
          <Card className="border-0 bg-transparent shadow-none">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="mb-4">
                  <div className="text-3xl font-bold text-ink mb-1">
                    {progressPercent === 100 ? '🎉' : '💪'}
                  </div>
                  <p className="text-muted-foreground">
                    {progressPercent === 100 
                      ? "Amazing! You've completed all your goals for today!" 
                      : progressPercent >= 50 
                      ? "Great progress! Keep going!" 
                      : "You've got this! Take it one goal at a time."}
                  </p>
                </div>
                
                <div className="w-full bg-muted rounded-full h-3">
                  <div 
                    className="bg-success h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </NotebookPage>
      )}
    </div>
  );
}