import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatDate, formatTime } from '@/lib/storage';

interface LLMStat {
  id: number;
  user_id: string;
  created_at: string;
  tokens_total: number;
  mem_items: number;
  top_score: number;
  intent: string;
}

export default function TestLLMStats() {
  const [stats, setStats] = useState<LLMStat[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-llm-stats');
      
      if (error) {
        console.error('Error fetching LLM stats:', error);
        return;
      }

      setStats(data.stats || []);
    } catch (error) {
      console.error('Failed to fetch LLM stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const testLongJournal = async () => {
    setLoading(true);
    try {
      // Create a very long journal entry first
      const longContent = `Today was an incredibly eventful and transformative day that I want to document in great detail. I started my morning at 5:30 AM with my usual meditation practice, spending 20 minutes in mindful breathing while sitting by the window overlooking the garden. The sunrise was particularly beautiful today, casting golden rays through the oak tree branches that created intricate shadow patterns on my meditation cushion.

After meditation, I went for a 45-minute run through the neighborhood park. The weather was perfect - crisp autumn air with temperatures around 55 degrees Fahrenheit. I encountered several other early morning runners and exchanged friendly nods with the regular dog walkers. My running pace felt strong and consistent, and I noticed my endurance has improved significantly over the past month of consistent training.

During breakfast, I read three chapters of "The Power of Now" by Eckhart Tolle, which provided profound insights about presence and mindfulness that I want to integrate into my daily practice. The author's perspective on ego-dissolution and living in the present moment resonated deeply with my current life circumstances and personal growth journey.

At work, I had a breakthrough meeting with our development team where we finally solved the architectural challenges that had been blocking our project for three weeks. The solution involved implementing a microservices pattern with Docker containers and Kubernetes orchestration. I felt immense satisfaction seeing the team collaborate effectively and witnessing the moment when complex technical concepts clicked for everyone involved.

Lunch was a delightful affair at the new Mediterranean restaurant downtown. I tried their lamb shawarma with tahini sauce, roasted vegetables, and quinoa pilaf. The flavors were exceptional, and I made mental notes about the spice combinations for my own cooking experiments this weekend.

The afternoon brought an unexpected phone call from my college roommate, whom I hadn't spoken with in over two years. We spent an hour catching up on life changes, career developments, and mutual friends. It reminded me of the importance of maintaining meaningful connections and not letting busy schedules prevent us from nurturing important relationships.

Evening activities included grocery shopping for the week ahead, preparing a healthy dinner of grilled salmon with asparagus and brown rice, and spending quality time with my family discussing everyone's highlights from the day. My daughter shared exciting news about her science fair project on renewable energy, and my partner and I made plans for a weekend hiking trip to explore new trails in the nearby mountain preserve.

Before bed, I spent time journaling about gratitude, identifying at least five specific things I felt thankful for: good health enabling my morning run, meaningful work that challenges and fulfills me, unexpected reconnection with an old friend, nutritious food that nourishes my body, and the loving support of my family members who make every day brighter and more meaningful.`;

      // Send to AI copilot which should trigger the middleware
      const { data, error } = await supabase.functions.invoke('ai-copilot', {
        body: {
          messages: [
            { 
              role: 'user', 
              content: `Please analyze this journal entry and tell me what patterns you notice: ${longContent}` 
            }
          ]
        }
      });

      if (error) {
        console.error('Error testing with long journal:', error);
      } else {
        console.log('Long journal test response:', data);
        // Refresh stats after test
        await new Promise(resolve => setTimeout(resolve, 2000));
        await fetchStats();
      }
    } catch (error) {
      console.error('Failed to test long journal:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">LLM Stats & Testing</h1>
        <div className="space-x-2">
          <Button onClick={fetchStats} disabled={loading}>
            Refresh Stats
          </Button>
          <Button onClick={testLongJournal} disabled={loading}>
            Test Long Journal
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent LLM Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : stats.length === 0 ? (
            <p>No LLM usage statistics found. Try sending a message to the AI copilot.</p>
          ) : (
            <div className="space-y-4">
              {stats.map((stat) => (
                <div key={stat.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        {formatDate(new Date(stat.created_at))} at {formatTime(new Date(stat.created_at))}
                      </div>
                      <div className="font-medium">
                        Intent: <span className="capitalize">{stat.intent}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-lg font-bold">{stat.tokens_total} tokens</div>
                      <div className="text-sm text-muted-foreground">
                        {stat.mem_items} memory items
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Top Score: {stat.top_score?.toFixed(3) || 'N/A'}</span>
                    <span>ID: {stat.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}