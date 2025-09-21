import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, RefreshCw, Settings as SettingsIcon, Shield, Bell } from 'lucide-react';
import { useVectorization } from '@/hooks/useVectorization';

const Settings = () => {
  const { vectorizeAllData, vectorizeContacts, isVectorizing, progress } = useVectorization();

  return (
    <div className="container mx-auto py-4 md:py-8 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-2xl md:text-4xl font-bold">Settings</h1>
        <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto">
          Configure your application settings, manage data, and customize your experience.
        </p>
      </div>

      <Tabs defaultValue="data" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="data" className="flex items-center gap-2 text-xs md:text-sm">
            <Database className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Data Management</span>
            <span className="sm:hidden">Data</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2 text-xs md:text-sm">
            <Shield className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Privacy & Security</span>
            <span className="sm:hidden">Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 text-xs md:text-sm">
            <Bell className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Notifications</span>
            <span className="sm:hidden">Alerts</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Database className="h-4 w-4 md:h-5 md:w-5" />
                Data Vectorization
              </CardTitle>
              <CardDescription className="text-sm">
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
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={vectorizeAllData} className="flex items-center gap-2 text-sm">
                    <RefreshCw className="h-3 w-3 md:h-4 md:w-4" />
                    Vectorize All Data
                  </Button>
                  <Button variant="outline" onClick={vectorizeContacts} className="flex items-center gap-2 text-sm">
                    <Database className="h-3 w-3 md:h-4 md:w-4" />
                    Vectorize Contacts Only
                  </Button>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>First time?</strong> Click "Vectorize All Data" to process all your existing information.
                  This may take a few minutes depending on how much data you have.
                </p>
                <p>
                  <strong>Regular updates:</strong> The AI will automatically process new data as you add it,
                  but you can manually refresh if needed.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Data Storage</CardTitle>
              <CardDescription className="text-sm">
                Manage your local and cloud data storage preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Local Storage</h4>
                <p className="text-sm text-muted-foreground">
                  Your data is stored locally in your browser for quick access and offline functionality.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Cloud Sync</h4>
                <p className="text-sm text-muted-foreground">
                  AI processing and vector embeddings are stored securely in the cloud for enhanced features.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Privacy Settings</CardTitle>
              <CardDescription className="text-sm">
                Control how your data is used and processed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Data Processing</h4>
                <p className="text-sm text-muted-foreground">
                  Your personal data is processed locally and only anonymized insights are used for AI features.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Data Retention</h4>
                <p className="text-sm text-muted-foreground">
                  You have full control over your data and can delete it at any time.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Notification Preferences</CardTitle>
              <CardDescription className="text-sm">
                Configure when and how you receive notifications from your AI assistant.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">AI Reminders</h4>
                <p className="text-sm text-muted-foreground">
                  Receive smart reminders based on your goals and patterns.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Contact Follow-ups</h4>
                <p className="text-sm text-muted-foreground">
                  Get notified when it's time to reach out to contacts.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;