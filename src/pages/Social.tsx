import { ContactCard } from '@/components/ContactCard';
import { useContacts } from '@/hooks/useContacts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Calendar, Users, Clock, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Social() {
  const { dueContacts, loading, error, markContactSent, snoozeContact, skipContact, refreshContacts } = useContacts();
  const { toast } = useToast();

  const handleMarkSent = async (contactId: string, message: string) => {
    try {
      await markContactSent(contactId, message);
      toast({
        title: "Contact updated",
        description: "Message marked as sent and next contact scheduled.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update contact. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSnooze = async (contactId: string) => {
    try {
      await snoozeContact(contactId);
      toast({
        title: "Contact snoozed",
        description: "Contact will appear in your queue later.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to snooze contact. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSkip = async (contactId: string) => {
    try {
      await skipContact(contactId);
      toast({
        title: "Contact skipped",
        description: "Contact moved to next scheduled date.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to skip contact. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            Social CRM
          </h1>
          <p className="text-muted-foreground mt-2">
            Stay connected with your network through strategic relationship management
          </p>
        </div>
        <Button onClick={refreshContacts} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Demo Mode:</strong> This page shows demo contact data. 
          Connect to Supabase to manage real contacts and relationships.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dueContacts.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {dueContacts.filter(c => c.segment === 'TOP5').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dueContacts.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Contact Queue</CardTitle>
          <CardDescription>
            People you should reach out to today, prioritized by importance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>Error loading contacts: {error}</p>
            </div>
          ) : dueContacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No contacts due today</p>
              <p className="text-sm">Your relationship management is up to date!</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {dueContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onMarkSent={handleMarkSent}
                  onSnooze={handleSnooze}
                  onSkip={handleSkip}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <h4 className="mb-2">To connect to your Supabase backend:</h4>
            <ol className="text-sm space-y-1 ml-4 list-decimal">
              <li>Create environment variables: <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code></li>
              <li>Update the database queries in <code>src/hooks/useContacts.ts</code></li>
              <li>Create the contacts table in your Supabase database with the schema from <code>src/lib/supabase.ts</code></li>
              <li>Remove demo data and enable real Supabase queries</li>
            </ol>
            
            <div className="bg-muted/50 rounded p-3 mt-4">
              <h5 className="font-medium mb-2">Contact Schema:</h5>
              <pre className="text-xs whitespace-pre-wrap">
{`CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  preferred_name TEXT,
  email TEXT,
  phone_e164 TEXT,
  company TEXT,
  role TEXT,
  segment TEXT CHECK (segment IN ('TOP5', 'WEEKLY15', 'MONTHLY100')),
  importance_score INTEGER,
  frequency_days INTEGER,
  next_due_at TIMESTAMPTZ,
  last_contacted_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}