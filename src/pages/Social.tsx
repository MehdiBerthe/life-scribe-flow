import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NotebookPage } from '@/components/NotebookPage';
import { formatDate } from '@/lib/storage';
import { Users, Phone, Calendar } from 'lucide-react';

// Stub implementation - will be replaced with actual Lovable CRM code
interface CRMContact {
  name: string;
  contact_id: number;
  next_touch_date: string;
  last_touch?: string;
  notes?: string;
}

// Stub functions - replace these with your Lovable CRM implementation
function upsertContact(name: string, lastTouch?: Date, nextTouch?: Date, notes?: string): number {
  // TODO: replace with Lovable impl
  console.log('upsertContact called:', { name, lastTouch, nextTouch, notes });
  return 1;
}

function listNextPings(limit: number = 10): CRMContact[] {
  // TODO: replace with Lovable impl
  const mockData: CRMContact[] = [
    {
      name: "Alice Johnson",
      contact_id: 1,
      next_touch_date: "2025-09-25",
      last_touch: "2025-09-15",
      notes: "Follow up on project collaboration"
    },
    {
      name: "Bob Smith",
      contact_id: 2,
      next_touch_date: "2025-09-28",
      last_touch: "2025-09-10",
      notes: "Check in about quarterly review"
    },
    {
      name: "Carol Wilson",
      contact_id: 3,
      next_touch_date: "2025-10-02",
      last_touch: "2025-08-20",
      notes: "Birthday coming up - send wishes"
    },
    {
      name: "David Brown",
      contact_id: 4,
      next_touch_date: "2025-10-05",
      notes: "New contact - initial outreach"
    },
    {
      name: "Emma Davis",
      contact_id: 5,
      next_touch_date: "2025-10-08",
      last_touch: "2025-09-01",
      notes: "Quarterly coffee catch-up"
    }
  ];
  
  return mockData.slice(0, limit);
}

export default function Social() {
  const [nextPings, setNextPings] = useState<CRMContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for the stub
    setTimeout(() => {
      const pings = listNextPings(10);
      setNextPings(pings);
      setLoading(false);
    }, 500);
  }, []);

  const getDaysUntil = (dateString: string): number => {
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityColor = (daysUntil: number): string => {
    if (daysUntil < 0) return 'bg-destructive text-destructive-foreground';
    if (daysUntil === 0) return 'bg-orange-500 text-white';
    if (daysUntil <= 2) return 'bg-yellow-500 text-white';
    if (daysUntil <= 7) return 'bg-accent text-accent-foreground';
    return 'bg-muted text-muted-foreground';
  };

  const getPriorityLabel = (daysUntil: number): string => {
    if (daysUntil < 0) return `${Math.abs(daysUntil)}d overdue`;
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    return `${daysUntil}d`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-ink" />
          <h1 className="text-3xl font-bold text-ink">Social CRM</h1>
        </div>
      </div>

      {/* Integration Notice */}
      <NotebookPage>
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader>
            <CardTitle className="text-ink flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Integration Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-yellow-800 mb-1">
                    Stub Implementation Active
                  </p>
                  <p className="text-xs text-yellow-700">
                    This is showing sample data. To integrate your Lovable CRM code:
                  </p>
                  <ol className="text-xs text-yellow-700 mt-2 ml-4 list-decimal space-y-1">
                    <li>Replace the stub functions in <code>src/pages/Social.tsx</code></li>
                    <li>Add your Lovable CRM implementation</li>
                    <li>Update the data types to match your schema</li>
                  </ol>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </NotebookPage>

      {/* Next Pings */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ink">Next Pings</h2>
        
        {loading ? (
          <NotebookPage showLines>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading contacts...</p>
            </div>
          </NotebookPage>
        ) : nextPings.length === 0 ? (
          <NotebookPage showLines>
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-ink mb-2">No upcoming pings</h3>
              <p className="text-muted-foreground">Your contact list is empty or no follow-ups are scheduled.</p>
            </div>
          </NotebookPage>
        ) : (
          nextPings.map((contact) => {
            const daysUntil = getDaysUntil(contact.next_touch_date);
            
            return (
              <NotebookPage key={contact.contact_id}>
                <Card className="border-0 bg-transparent shadow-none">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-ink">{contact.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(daysUntil)}`}>
                            {getPriorityLabel(daysUntil)}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span>Next touch: {formatDate(new Date(contact.next_touch_date))}</span>
                          </div>
                          
                          {contact.last_touch && (
                            <div className="flex items-center gap-2">
                              <Phone size={14} />
                              <span>Last contact: {formatDate(new Date(contact.last_touch))}</span>
                            </div>
                          )}
                        </div>
                        
                        {contact.notes && (
                          <div className="mt-3 p-2 bg-muted/50 rounded text-sm text-ink">
                            {contact.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </NotebookPage>
            );
          })
        )}
      </div>

      {/* Instructions for Integration */}
      <NotebookPage showLines>
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader>
            <CardTitle className="text-ink">Integration Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm text-ink">
              <h4 className="text-ink mb-2">To integrate your Lovable CRM code:</h4>
              <ol className="text-sm space-y-1 ml-4 list-decimal">
                <li>Locate the stub functions at the top of <code>src/pages/Social.tsx</code></li>
                <li>Replace <code>upsertContact()</code> with your contact creation/update logic</li>
                <li>Replace <code>listNextPings()</code> with your actual data fetching</li>
                <li>Update the <code>CRMContact</code> interface to match your data structure</li>
                <li>Remove the mock data and loading simulation</li>
              </ol>
              
              <div className="bg-muted/50 rounded p-3 mt-4">
                <h5 className="text-ink font-medium mb-2">Expected Interface:</h5>
                <pre className="text-xs text-ink whitespace-pre-wrap">
{`interface CRMContact {
  name: string;
  contact_id: number;
  next_touch_date: string;
  last_touch?: string;
  notes?: string;
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </NotebookPage>
    </div>
  );
}