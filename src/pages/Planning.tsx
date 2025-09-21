import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DailyGoals } from '@/components/DailyGoals';
import { DailyReview } from '@/components/DailyReview';
import { WeeklyGoals } from '@/components/WeeklyGoals';
import { WeeklyReview } from '@/components/WeeklyReview';
import { Target, Calendar, CheckSquare, BarChart3 } from 'lucide-react';

export default function Planning() {
  const [activeTab, setActiveTab] = useState('daily');
  const [dailySubTab, setDailySubTab] = useState('goals');
  const [weeklySubTab, setWeeklySubTab] = useState('goals');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Target className="h-6 w-6 text-foreground" />
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Planning</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="daily" className="flex items-center gap-2 text-sm md:text-base">
            <Target size={16} />
            <span className="hidden sm:inline">Daily</span>
            <span className="sm:hidden">Day</span>
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2 text-sm md:text-base">
            <Calendar size={16} />
            <span className="hidden sm:inline">Weekly</span>
            <span className="sm:hidden">Week</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6">
          <Tabs value={dailySubTab} onValueChange={setDailySubTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="goals" className="flex items-center gap-2 text-sm">
                <CheckSquare size={14} />
                Goals
              </TabsTrigger>
              <TabsTrigger value="review" className="flex items-center gap-2 text-sm">
                <BarChart3 size={14} />
                Review
              </TabsTrigger>
            </TabsList>

            <TabsContent value="goals" className="mt-6">
              <DailyGoals />
            </TabsContent>

            <TabsContent value="review" className="mt-6">
              <DailyReview />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-6">
          <Tabs value={weeklySubTab} onValueChange={setWeeklySubTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="goals" className="flex items-center gap-2 text-sm">
                <CheckSquare size={14} />
                Goals
              </TabsTrigger>
              <TabsTrigger value="review" className="flex items-center gap-2 text-sm">
                <BarChart3 size={14} />
                Review
              </TabsTrigger>
            </TabsList>

            <TabsContent value="goals" className="mt-6">
              <WeeklyGoals />
            </TabsContent>

            <TabsContent value="review" className="mt-6">
              <WeeklyReview />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}