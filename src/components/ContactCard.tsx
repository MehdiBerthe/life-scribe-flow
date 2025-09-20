import { Contact } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, SkipForward, ZapOff, Mail, Phone, Building, User, Calendar } from 'lucide-react';

interface ContactCardProps {
  contact: Contact;
  onMarkSent: (contactId: string) => void;
  onSnooze: (contactId: string) => void;
  onSkip: (contactId: string) => void;
}

export function ContactCard({ contact, onMarkSent, onSnooze, onSkip }: ContactCardProps) {
  const getSegmentColor = (segment?: string) => {
    if (!segment) return 'bg-secondary text-secondary-foreground';
    
    const colors: Record<string, string> = {
      'TOP5': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'WEEKLY15': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', 
      'MONTHLY100': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };
    return colors[segment] || 'bg-secondary text-secondary-foreground';
  };

  const isOverdue = contact.next_touch && contact.next_touch < new Date();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground">{contact.name}</h3>
            <div className="space-y-1 mt-1">
              {contact.company && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building size={14} />
                  <span>{contact.company}</span>
                </div>
              )}
              
              {contact.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail size={14} />
                  <span>{contact.email}</span>
                </div>
              )}
              
              {contact.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone size={14} />
                  <span>{contact.phone}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {contact.segment && (
              <Badge className={getSegmentColor(contact.segment)}>
                {contact.segment}
              </Badge>
            )}
            
            {contact.next_touch && (
              <div className={`text-xs flex items-center gap-1 ${
                isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
              }`}>
                <Calendar size={12} />
                <span>
                  {isOverdue ? 'Overdue' : 'Due'} {contact.next_touch.toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {contact.current_situation && (
          <div>
            <h4 className="text-sm font-medium mb-1 text-foreground">Current Situation</h4>
            <p className="text-sm text-muted-foreground">{contact.current_situation}</p>
          </div>
        )}
        
        {contact.working_on && (
          <div>
            <h4 className="text-sm font-medium mb-1 text-foreground">Working On</h4>
            <p className="text-sm text-muted-foreground">{contact.working_on}</p>
          </div>
        )}
        
        {contact.how_to_add_value && (
          <div>
            <h4 className="text-sm font-medium mb-1 text-foreground">How to Add Value</h4>
            <p className="text-sm text-muted-foreground">{contact.how_to_add_value}</p>
          </div>
        )}

        {contact.notes && (
          <div>
            <h4 className="text-sm font-medium mb-1 text-foreground">Notes</h4>
            <p className="text-sm text-muted-foreground">{contact.notes}</p>
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t border-border">
          <Button 
            onClick={() => onMarkSent(contact.id)}
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
      </CardContent>
    </Card>
  );
}