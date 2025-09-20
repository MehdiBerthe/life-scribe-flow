import { ContactCard } from '@/components/ContactCard';
import { useContacts } from '@/hooks/useContacts';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Users, Calendar, LogOut } from 'lucide-react';

export default function Social() {
  const { contacts, loading, dueContacts, markSent, snoozeContact, skipContact } = useContacts();
  const { signOut } = useAuth();

  const handleMarkSent = async (contactId: string) => {
    try {
      await markSent(contactId);
      toast({
        title: "Contact Updated",
        description: "Marked as contacted and scheduled for next week.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update contact.",
        variant: "destructive",
      });
    }
  };

  const handleSnooze = async (contactId: string) => {
    try {
      await snoozeContact(contactId);
      toast({
        title: "Contact Snoozed",
        description: "Contact has been snoozed for 7 days.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to snooze contact.",
        variant: "destructive",
      });
    }
  };

  const handleSkip = async (contactId: string) => {
    try {
      await skipContact(contactId);
      toast({
        title: "Contact Skipped",
        description: "Contact moved to tomorrow.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to skip contact.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-foreground" />
          <h1 className="text-3xl font-bold text-foreground">Social CRM</h1>
        </div>
        <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
          <LogOut size={16} />
          Sign Out
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dueContacts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Calendar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {contacts.filter(c => c.next_touch && c.next_touch < new Date()).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Contacts */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Contact Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading contacts...</p>
              </div>
            ) : dueContacts.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No contacts due today</h3>
                <p className="text-muted-foreground">
                  {contacts.length === 0 
                    ? "Start building your network by adding contacts to your CRM."
                    : "Great job! You're all caught up for today."
                  }
                </p>
              </div>
            ) : (
              dueContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onMarkSent={() => handleMarkSent(contact.id)}
                  onSnooze={() => handleSnooze(contact.id)}
                  onSkip={() => handleSkip(contact.id)}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}