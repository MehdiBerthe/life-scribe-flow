import { Contact } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, CheckCircle, SkipForward, ZapOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ContactCardProps {
  contact: Contact;
  onMarkSent: (contactId: string, message: string) => void;
  onSnooze: (contactId: string) => void;
  onSkip: (contactId: string) => void;
}

export function ContactCard({ contact, onMarkSent, onSnooze, onSkip }: ContactCardProps) {
  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'TOP5': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'WEEKLY15': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'MONTHLY100': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const handleMarkSent = () => {
    onMarkSent(contact.id, `Reached out to ${contact.preferred_name || contact.first_name}`);
  };

  const formatNextDue = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isOverdue = date < now;
    
    return {
      text: formatDistanceToNow(date, { addSuffix: !isOverdue }),
      isOverdue
    };
  };

  const nextDueInfo = contact.next_due_at ? formatNextDue(contact.next_due_at) : null;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">
              {contact.preferred_name || contact.first_name} {contact.last_name}
            </h3>
            {contact.company && (
              <p className="text-sm text-muted-foreground">
                {contact.role} at {contact.company}
              </p>
            )}
            {contact.city && (
              <p className="text-xs text-muted-foreground">{contact.city}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getSegmentColor(contact.segment)}>
              {contact.segment}
            </Badge>
            {nextDueInfo && (
              <div className={`text-xs flex items-center gap-1 ${
                nextDueInfo.isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
              }`}>
                <Clock size={12} />
                {nextDueInfo.isOverdue ? 'Overdue' : 'Due'} {nextDueInfo.text}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {contact.current_situation && (
          <div>
            <h4 className="text-sm font-medium mb-1">Current Situation</h4>
            <p className="text-sm text-muted-foreground">{contact.current_situation}</p>
          </div>
        )}
        
        {contact.working_on && (
          <div>
            <h4 className="text-sm font-medium mb-1">Working On</h4>
            <p className="text-sm text-muted-foreground">{contact.working_on}</p>
          </div>
        )}
        
        {contact.how_i_can_add_value && (
          <div>
            <h4 className="text-sm font-medium mb-1">How I Can Add Value</h4>
            <p className="text-sm text-muted-foreground">{contact.how_i_can_add_value}</p>
          </div>
        )}

        {contact.notes && (
          <div>
            <h4 className="text-sm font-medium mb-1">Notes</h4>
            <p className="text-sm text-muted-foreground">{contact.notes}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleMarkSent}
            className="flex-1"
            size="sm"
          >
            <CheckCircle size={16} className="mr-2" />
            Mark Sent
          </Button>
          
          <Button 
            onClick={() => onSnooze(contact.id)}
            variant="outline"
            size="sm"
          >
            <ZapOff size={16} className="mr-1" />
            Snooze
          </Button>
          
          <Button 
            onClick={() => onSkip(contact.id)}
            variant="outline"
            size="sm"
          >
            <SkipForward size={16} className="mr-1" />
            Skip
          </Button>
        </div>

        <div className="flex gap-2 text-xs text-muted-foreground">
          {contact.email && (
            <span>📧 {contact.email}</span>
          )}
          {contact.phone_e164 && (
            <span>📱 {contact.phone_e164}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}