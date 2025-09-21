import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { storage, generateId, formatDate } from '@/lib/storage';
import { EndOfDayReview, DAILY_CHECKLIST_SIMPLIFIED } from '@/types';
import { Moon, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { indexForRag } from '@/lib/rag';

export function DailyReview() {
  const [reviews, setReviews] = useState<EndOfDayReview[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  const [reviewForm, setReviewForm] = useState({
    wentWell: '',
    couldImprove: '',
    keyAccomplishments: '',
    lessonsLearned: '',
    tomorrowsFocus: '',
    mood: [3] as number[],
    energyLevel: [3] as number[],
    gratitude: '',
    dailyChecklist: {} as Record<string, boolean>,
  });

  useEffect(() => {
    const loadedReviews = storage.endOfDayReviews.getAll();
    setReviews(loadedReviews.sort((a, b) => b.date.getTime() - a.date.getTime()));
  }, []);

  // Initialize checklist when form opens
  useEffect(() => {
    if (showReviewForm) {
      const initialDailyChecklist = {} as Record<string, boolean>;
      DAILY_CHECKLIST_SIMPLIFIED.forEach(item => {
        initialDailyChecklist[item] = false;
      });
      setReviewForm(prev => ({ ...prev, dailyChecklist: initialDailyChecklist }));
    }
  }, [showReviewForm]);

  const addReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.wentWell.trim() || !reviewForm.couldImprove.trim()) {
      toast({
        title: "Error",
        description: "Please fill in what went well and what could improve.",
        variant: "destructive"
      });
      return;
    }

    const review: EndOfDayReview = {
      id: generateId(),
      date: new Date(),
      wentWell: reviewForm.wentWell.trim(),
      couldImprove: reviewForm.couldImprove.trim(),
      keyAccomplishments: reviewForm.keyAccomplishments.trim() || undefined,
      lessonsLearned: reviewForm.lessonsLearned.trim() || undefined,
      tomorrowsFocus: reviewForm.tomorrowsFocus.trim() || undefined,
      mood: reviewForm.mood[0] as 1 | 2 | 3 | 4 | 5,
      energyLevel: reviewForm.energyLevel[0] as 1 | 2 | 3 | 4 | 5,
      gratitude: reviewForm.gratitude.trim() || undefined,
      dailyChecklist: reviewForm.dailyChecklist,
      createdAt: new Date(),
    };

    const updatedReviews = [review, ...reviews];
    setReviews(updatedReviews);
    storage.endOfDayReviews.save(updatedReviews);

    // Index for RAG
    await indexForRag({
      userId: 'single-user',
      kind: 'reflection',
      refId: review.id,
      title: `Daily Review - ${formatDate(review.date)}`,
      content: `What went well: ${review.wentWell}\n\nWhat could improve: ${review.couldImprove}${review.keyAccomplishments ? `\n\nKey accomplishments: ${review.keyAccomplishments}` : ''}${review.lessonsLearned ? `\n\nLessons learned: ${review.lessonsLearned}` : ''}${review.tomorrowsFocus ? `\n\nTomorrow's focus: ${review.tomorrowsFocus}` : ''}${review.gratitude ? `\n\nGratitude: ${review.gratitude}` : ''}`,
      metadata: {
        mood: review.mood,
        energy_level: review.energyLevel,
        review_type: 'daily'
      }
    });
    
    setReviewForm({
      wentWell: '',
      couldImprove: '',
      keyAccomplishments: '',
      lessonsLearned: '',
      tomorrowsFocus: '',
      mood: [3],
      energyLevel: [3],
      gratitude: '',
      dailyChecklist: {},
    });
    setShowReviewForm(false);
    
    toast({
      title: "Day Review Added",
      description: "Your daily reflection has been saved."
    });
  };

  return (
    <div className="space-y-6">
      {/* Add Review Button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5" />
              End of Day Review
            </div>
            <Button onClick={() => setShowReviewForm(!showReviewForm)}>
              <Plus className="h-4 w-4 mr-2" />
              {showReviewForm ? 'Cancel' : 'Add Review'}
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Review Form */}
      {showReviewForm && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Reflection</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addReview} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">What went well today?</label>
                  <Textarea
                    value={reviewForm.wentWell}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, wentWell: e.target.value }))}
                    placeholder="Reflect on the positive aspects..."
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">What could improve?</label>
                  <Textarea
                    value={reviewForm.couldImprove}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, couldImprove: e.target.value }))}
                    placeholder="Areas for growth..."
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Key Accomplishments</label>
                  <Textarea
                    value={reviewForm.keyAccomplishments}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, keyAccomplishments: e.target.value }))}
                    placeholder="What did you achieve today?"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Lessons Learned</label>
                  <Textarea
                    value={reviewForm.lessonsLearned}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, lessonsLearned: e.target.value }))}
                    placeholder="What insights did you gain?"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tomorrow's Focus</label>
                <Textarea
                  value={reviewForm.tomorrowsFocus}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, tomorrowsFocus: e.target.value }))}
                  placeholder="What will you prioritize tomorrow?"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Mood (1-5): {reviewForm.mood[0]}
                  </label>
                  <Slider
                    value={reviewForm.mood}
                    onValueChange={(value) => setReviewForm(prev => ({ ...prev, mood: value }))}
                    max={5}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Energy Level (1-5): {reviewForm.energyLevel[0]}
                  </label>
                  <Slider
                    value={reviewForm.energyLevel}
                    onValueChange={(value) => setReviewForm(prev => ({ ...prev, energyLevel: value }))}
                    max={5}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Gratitude</label>
                <Textarea
                  value={reviewForm.gratitude}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, gratitude: e.target.value }))}
                  placeholder="What are you grateful for today?"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block">Daily Checklist</label>
                <div className="grid md:grid-cols-2 gap-2">
                  {DAILY_CHECKLIST_SIMPLIFIED.map((item) => (
                    <div key={item} className="flex items-center space-x-2">
                      <Checkbox
                        checked={reviewForm.dailyChecklist[item] || false}
                        onCheckedChange={(checked) =>
                          setReviewForm(prev => ({
                            ...prev,
                            dailyChecklist: { ...prev.dailyChecklist, [item]: !!checked }
                          }))
                        }
                      />
                      <label className="text-sm">{item}</label>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full">Save Review</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Past Reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardHeader>
              <CardTitle className="text-lg">{formatDate(review.date)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm mb-1">Went Well</h4>
                  <p className="text-sm text-muted-foreground">{review.wentWell}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">Could Improve</h4>
                  <p className="text-sm text-muted-foreground">{review.couldImprove}</p>
                </div>
              </div>

              {(review.keyAccomplishments || review.lessonsLearned || review.tomorrowsFocus) && (
                <div className="grid md:grid-cols-3 gap-4">
                  {review.keyAccomplishments && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Accomplishments</h4>
                      <p className="text-sm text-muted-foreground">{review.keyAccomplishments}</p>
                    </div>
                  )}
                  {review.lessonsLearned && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Lessons</h4>
                      <p className="text-sm text-muted-foreground">{review.lessonsLearned}</p>
                    </div>
                  )}
                  {review.tomorrowsFocus && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Tomorrow's Focus</h4>
                      <p className="text-sm text-muted-foreground">{review.tomorrowsFocus}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-6 text-sm">
                <span>Mood: {review.mood}/5</span>
                <span>Energy: {review.energyLevel}/5</span>
                {review.gratitude && (
                  <span className="text-muted-foreground">Gratitude: {review.gratitude}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}