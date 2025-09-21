import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { storage, generateId, formatDate, getWeekStart } from '@/lib/storage';
import { WeeklyPlan } from '@/types';
import { List, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function WeeklyGoals() {
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([]);
  const [newPriority, setNewPriority] = useState('');

  useEffect(() => {
    const loadedPlans = storage.weeklyPlans.getAll();
    setWeeklyPlans(loadedPlans.sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime()));
  }, []);

  const currentWeekStart = getWeekStart(new Date());
  const currentWeekPlan = weeklyPlans.find(plan => 
    plan.weekStart.getTime() === currentWeekStart.getTime()
  );

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

  return (
    <div className="space-y-6">
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
                  className="text-destructive hover:text-destructive"
                >
                  Remove
                </Button>
              </div>
            )) || (
              <div className="text-center py-8">
                <List size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No priorities set for this week</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Previous Weeks */}
      {weeklyPlans.filter(plan => plan.weekStart.getTime() !== currentWeekStart.getTime()).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Weeks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyPlans
                .filter(plan => plan.weekStart.getTime() !== currentWeekStart.getTime())
                .slice(0, 5)
                .map((plan) => (
                  <div key={plan.id} className="border-l-4 border-muted pl-4">
                    <h4 className="font-medium text-foreground mb-2">
                      Week of {formatDate(plan.weekStart)}
                    </h4>
                    <div className="space-y-1">
                      {plan.priorities.map((priority, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span className="flex-shrink-0 w-4 h-4 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center">
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
    </div>
  );
}