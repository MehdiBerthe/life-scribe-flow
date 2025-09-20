import { useState } from 'react';
import { ContactCard } from '@/components/ContactCard';
import { useContacts } from '@/hooks/useContacts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Users, Calendar, Plus, X } from 'lucide-react';
import { Contact } from '@/types';

export default function Social() {
  const { contacts, loading, dueContacts, markSent, snoozeContact, skipContact, addContact } = useContacts();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Contact>>({
    name: '',
    email: '',
    phone: '',
    company: '',
    segment: '',
    current_situation: '',
    working_on: '',
    how_to_add_value: '',
    notes: '',
  });

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      toast({
        title: "Error",
        description: "Contact name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const contactData = {
        ...formData,
        name: formData.name!.trim(),
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        company: formData.company?.trim() || undefined,
        segment: formData.segment?.trim() || undefined,
        current_situation: formData.current_situation?.trim() || undefined,
        working_on: formData.working_on?.trim() || undefined,
        how_to_add_value: formData.how_to_add_value?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        next_touch: new Date(), // Set to today so it appears in due contacts
      };

      await addContact(contactData as Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at'>);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        segment: '',
        current_situation: '',
        working_on: '',
        how_to_add_value: '',
        notes: '',
      });
      setShowAddForm(false);
      
      toast({
        title: "Contact Added",
        description: `${contactData.name} has been added to your CRM.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add contact. Please try again.",
        variant: "destructive",
      });
    }
  };

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


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-foreground" />
          <h1 className="text-3xl font-bold text-foreground">Social CRM</h1>
        </div>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="segment">Segment</Label>
                <Select value={formData.segment || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, segment: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TOP5">Top 5 (Daily)</SelectItem>
                    <SelectItem value="WEEKLY15">Weekly 15</SelectItem>
                    <SelectItem value="MONTHLY100">Monthly 100</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="current_situation">Current Situation</Label>
                <Textarea
                  id="current_situation"
                  value={formData.current_situation || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_situation: e.target.value }))}
                  placeholder="What's happening in their life/work right now?"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="working_on">What They're Working On</Label>
                <Textarea
                  id="working_on"
                  value={formData.working_on || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, working_on: e.target.value }))}
                  placeholder="Current projects, goals, or challenges"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="how_to_add_value">How to Add Value</Label>
                <Textarea
                  id="how_to_add_value"
                  value={formData.how_to_add_value || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, how_to_add_value: e.target.value }))}
                  placeholder="Ways you can help them or add value to their work/life"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this contact"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Add Contact
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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