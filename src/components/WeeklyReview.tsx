import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { storage, generateId, formatDate, getWeekStart } from '@/lib/storage';
import { EndOfWeekReview, WEEKLY_CHECKLIST } from '@/types';
import { BarChart3, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function WeeklyReview() {
  const [reviews, setReviews] = useState<EndOfWeekReview[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  const [reviewForm, setReviewForm] = useState({
    accomplishments: '',
    challenges: '',
    lessonsLearned: '',
    nextWeekFocus: '',
    overallSatisfaction: [3] as number[],
    prioritiesCompleted: [0] as number[],
    weeklyChecklist: {} as Record<string, boolean>,
  });

  useEffect(() => {
    const loadedReviews = storage.endOfWeekReviews.getAll();
    setReviews(loadedReviews.sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime()));
  }, []);

  // Initialize checklist when form opens
  useEffect(() => {
    if (showReviewForm) {
      const initialWeeklyChecklist = {} as Record<string, boolean>;
      WEEKLY_CHECKLIST.forEach(item => {
        initialWeeklyChecklist[item] = false;
      });
      setReviewForm(prev => ({ ...prev, weeklyChecklist: initialWeeklyChecklist }));
    }
  }, [showReviewForm]);

  const addReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.accomplishments.trim() || !reviewForm.challenges.trim()) {
      toast({
        title: "Error",
        description: "Please fill in accomplishments and challenges.",
        variant: "destructive"
      });
      return;
    }

    const review: EndOfWeekReview = {
      id: generateId(),
      weekStart: getWeekStart(new Date()),
      accomplishments: reviewForm.accomplishments.trim(),
      challenges: reviewForm.challenges.trim(),
      lessonsLearned: reviewForm.lessonsLearned.trim() || undefined,
      nextWeekFocus: reviewForm.nextWeekFocus.trim() || undefined,
      overallSatisfaction: reviewForm.overallSatisfaction[0] as 1 | 2 | 3 | 4 | 5,
      prioritiesCompleted: reviewForm.prioritiesCompleted[0],
      weeklyChecklist: reviewForm.weeklyChecklist,
      createdAt: new Date(),
    };

    const updatedReviews = [review, ...reviews];
    setReviews(updatedReviews);
    storage.endOfWeekReviews.save(updatedReviews);
    
    setReviewForm({
      accomplishments: '',
      challenges: '',
      lessonsLearned: '',
      nextWeekFocus: '',
      overallSatisfaction: [3],
      prioritiesCompleted: [0],
      weeklyChecklist: {},
    });
    setShowReviewForm(false);
    
    toast({
      title: "End of Week Review Added",
      description: "Your weekly reflection has been saved."
    });
  };

  const formatWeekRange = (weekStart: Date): string => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
  };

  return (
    <div className="space-y-6">
      {/* Add Review Button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              End of Week Review
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
            <CardTitle>This Week's Reflection</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addReview} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Accomplishments</label>
                  <Textarea
                    value={reviewForm.accomplishments}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, accomplishments: e.target.value }))}
                    placeholder="What did you achieve this week?"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Challenges</label>
                  <Textarea
                    value={reviewForm.challenges}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, challenges: e.target.value }))}
                    placeholder="What obstacles did you face?"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Lessons Learned</label>
                  <Textarea
                    value={reviewForm.lessonsLearned}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, lessonsLearned: e.target.value }))}
                    placeholder="What insights did you gain?"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Next Week's Focus</label>
                  <Textarea
                    value={reviewForm.nextWeekFocus}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, nextWeekFocus: e.target.value }))}
                    placeholder="What will you focus on next week?"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Overall Satisfaction (1-5): {reviewForm.overallSatisfaction[0]}
                  </label>
                  <Slider
                    value={reviewForm.overallSatisfaction}
                    onValueChange={(value) => setReviewForm(prev => ({ ...prev, overallSatisfaction: value }))}
                    max={5}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Priorities Completed: {reviewForm.prioritiesCompleted[0]}
                  </label>
                  <Slider
                    value={reviewForm.prioritiesCompleted}
                    onValueChange={(value) => setReviewForm(prev => ({ ...prev, prioritiesCompleted: value }))}
                    max={7}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block">Weekly Checklist</label>
                <div className="grid md:grid-cols-2 gap-2">
                  {WEEKLY_CHECKLIST.map((item) => (
                    <div key={item} className="flex items-center space-x-2">
                      <Checkbox
                        checked={reviewForm.weeklyChecklist[item] || false}
                        onCheckedChange={(checked) =>
                          setReviewForm(prev => ({
                            ...prev,
                            weeklyChecklist: { ...prev.weeklyChecklist, [item]: !!checked }
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
              <CardTitle className="text-lg">{formatWeekRange(review.weekStart)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm mb-1">Accomplishments</h4>
                  <p className="text-sm text-muted-foreground">{review.accomplishments}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">Challenges</h4>
                  <p className="text-sm text-muted-foreground">{review.challenges}</p>
                </div>
              </div>

              {(review.lessonsLearned || review.nextWeekFocus) && (
                <div className="grid md:grid-cols-2 gap-4">
                  {review.lessonsLearned && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Lessons Learned</h4>
                      <p className="text-sm text-muted-foreground">{review.lessonsLearned}</p>
                    </div>
                  )}
                  {review.nextWeekFocus && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Next Week's Focus</h4>
                      <p className="text-sm text-muted-foreground">{review.nextWeekFocus}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-6 text-sm">
                <span>Satisfaction: {review.overallSatisfaction}/5</span>
                <span>Priorities Completed: {review.prioritiesCompleted}/7</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}