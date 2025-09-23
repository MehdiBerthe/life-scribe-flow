import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface SideSelectorProps {
  onSideSelected: (side: 'A' | 'B' | 'C', sideCMode?: 'self' | 'relief' | 'grief', traitOrEvent?: string) => void;
  onCancel: () => void;
}

export function DemartiniSideSelector({ onSideSelected, onCancel }: SideSelectorProps) {
  const [step, setStep] = useState(1);
  const [emotionalCharge, setEmotionalCharge] = useState('');
  const [situationType, setSituationType] = useState('');
  const [sideCMode, setSideCMode] = useState<'self' | 'relief' | 'grief'>('self');
  const [traitOrEvent, setTraitOrEvent] = useState('');

  const handleNext = () => {
    if (step === 1 && emotionalCharge) {
      if (emotionalCharge === 'admiration' || emotionalCharge === 'resentment') {
        setStep(2);
      } else if (emotionalCharge === 'loss-gain') {
        setStep(2);
      }
    } else if (step === 2) {
      if (emotionalCharge === 'loss-gain' && situationType) {
        setStep(3);
      } else if ((emotionalCharge === 'admiration' || emotionalCharge === 'resentment') && traitOrEvent.trim()) {
        if (emotionalCharge === 'admiration') {
          onSideSelected('A', undefined, traitOrEvent.trim());
        } else {
          onSideSelected('B', undefined, traitOrEvent.trim());
        }
      }
    } else if (step === 3 && situationType && traitOrEvent.trim()) {
      let mode: 'self' | 'relief' | 'grief' = 'self';
      if (situationType === 'loss') {
        mode = 'grief';
      } else if (situationType === 'gain') {
        mode = 'relief';
      } else if (situationType === 'self-change') {
        mode = 'self';
      }
      onSideSelected('C', mode, traitOrEvent.trim());
    }
  };

  const canProceed = () => {
    if (step === 1) return !!emotionalCharge;
    if (step === 2) {
      if (emotionalCharge === 'loss-gain') return !!situationType;
      return !!traitOrEvent.trim();
    }
    if (step === 3) return !!traitOrEvent.trim();
    return false;
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Identify Your Emotional Charge</CardTitle>
        <p className="text-sm text-muted-foreground">
          Let's determine which side of the Demartini Method best fits your current situation.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 1 && (
          <>
            <div>
              <h3 className="font-medium mb-4">What best describes your current emotional state?</h3>
              <RadioGroup value={emotionalCharge} onValueChange={setEmotionalCharge}>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 border rounded-lg">
                    <RadioGroupItem value="admiration" id="admiration" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="admiration" className="font-medium cursor-pointer">
                        I admire someone intensely (Side A)
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        You feel this person is superior, on a pedestal, or has qualities you wish you had. 
                        You may feel inferior or envious around them.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-4 border rounded-lg">
                    <RadioGroupItem value="resentment" id="resentment" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="resentment" className="font-medium cursor-pointer">
                        I resent or despise someone (Side B)
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        You feel angry, frustrated, or disgusted by this person's traits or actions. 
                        You may judge them harshly or feel they're beneath you.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-4 border rounded-lg">
                    <RadioGroupItem value="loss-gain" id="loss-gain" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="loss-gain" className="font-medium cursor-pointer">
                        I'm dealing with a major loss or gain (Side C)
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        You've experienced a significant life change: someone left, someone new arrived, 
                        or you feel you've changed in some important way.
                      </p>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </>
        )}

        {step === 2 && emotionalCharge === 'loss-gain' && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-medium">What type of change are you experiencing?</h3>
            </div>
            <RadioGroup value={situationType} onValueChange={setSituationType}>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 border rounded-lg">
                  <RadioGroupItem value="loss" id="loss" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="loss" className="font-medium cursor-pointer">
                      Someone important left my life (Grief)
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Death, breakup, divorce, job loss, moving away, etc.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 border rounded-lg">
                  <RadioGroupItem value="gain" id="gain" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="gain" className="font-medium cursor-pointer">
                      Someone new entered my life (Relief)
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      New relationship, baby, job, mentor, friend, etc.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 border rounded-lg">
                  <RadioGroupItem value="self-change" id="self-change" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="self-change" className="font-medium cursor-pointer">
                      I feel I've changed as a person (Self)
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      You feel you've gained or lost certain traits or qualities about yourself.
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </>
        )}

        {step === 2 && (emotionalCharge === 'admiration' || emotionalCharge === 'resentment') && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-medium">
                {emotionalCharge === 'admiration' ? 'What trait do you admire?' : 'What trait do you despise?'}
              </h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="trait">
                {emotionalCharge === 'admiration' 
                  ? 'Enter the specific trait you admire (e.g., "confidence", "intelligence", "kindness")' 
                  : 'Enter the specific trait you despise (e.g., "arrogance", "dishonesty", "selfishness")'
                }
              </Label>
              <Input
                id="trait"
                value={traitOrEvent}
                onChange={(e) => setTraitOrEvent(e.target.value)}
                placeholder={emotionalCharge === 'admiration' ? 'e.g., confidence' : 'e.g., arrogance'}
              />
            </div>
          </>
        )}

        {step === 3 && emotionalCharge === 'loss-gain' && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-medium">Describe the event</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event">
                Briefly describe what happened
              </Label>
              <Textarea
                id="event"
                value={traitOrEvent}
                onChange={(e) => setTraitOrEvent(e.target.value)}
                placeholder="e.g., My father passed away last month..."
                rows={3}
              />
            </div>
          </>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleNext} disabled={!canProceed()}>
            {(step === 1 && emotionalCharge === 'loss-gain') || (step === 2 && emotionalCharge === 'loss-gain') ? (
              <>Next <ArrowRight className="h-4 w-4 ml-2" /></>
            ) : (
              'Start Session'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}