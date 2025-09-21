import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, MessageSquare, Zap } from 'lucide-react';
import AICopilot from '@/components/AICopilot';

const AICopilotPage = () => {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">AI Co-Pilot</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Your intelligent assistant that knows your data, understands your patterns, 
          and can take actions to help you stay organized and productive.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="capabilities" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Capabilities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <AICopilot />
        </TabsContent>


        <TabsContent value="capabilities" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Intelligent Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Pattern Recognition</h4>
                  <p className="text-sm text-muted-foreground">
                    Identifies trends in your journal entries, productivity patterns, and goal progress.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Contextual Insights</h4>
                  <p className="text-sm text-muted-foreground">
                    Understands relationships between your activities, energy levels, and outcomes.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Semantic Search</h4>
                  <p className="text-sm text-muted-foreground">
                    Finds relevant information based on meaning, not just keywords.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Proactive Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Contact Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Creates contacts, schedules follow-ups, and reminds you to stay in touch.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Goal Tracking</h4>
                  <p className="text-sm text-muted-foreground">
                    Monitors progress, suggests adjustments, and celebrates achievements.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Smart Reminders</h4>
                  <p className="text-sm text-muted-foreground">
                    Sets contextual reminders based on your patterns and priorities.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Example Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium text-primary">📊 Data Analysis</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>"What patterns do you see in my energy levels?"</li>
                      <li>"How has my reading progress been this month?"</li>
                      <li>"Which goals am I falling behind on?"</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-primary">🎯 Action Items</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>"Remind me to follow up with John next week"</li>
                      <li>"Create a contact for the person I met today"</li>
                      <li>"Schedule time to work on my fitness goal"</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-primary">🔍 Search & Recall</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>"What did I write about my presentation anxiety?"</li>
                      <li>"Find contacts in the tech industry"</li>
                      <li>"When was the last time I exercised?"</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-primary">💡 Insights</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>"What correlates with my most productive days?"</li>
                      <li>"How can I improve my sleep schedule?"</li>
                      <li>"What's my best time of day for focused work?"</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AICopilotPage;