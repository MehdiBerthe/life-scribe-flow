import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Database, MessageSquare, Zap, RefreshCw } from 'lucide-react';
import AICopilot from '@/components/AICopilot';
import { useVectorization } from '@/hooks/useVectorization';

const AICopilotPage = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const { vectorizeAllData, vectorizeContacts, isVectorizing, progress } = useVectorization();

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Setup
          </TabsTrigger>
          <TabsTrigger value="capabilities" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Capabilities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
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