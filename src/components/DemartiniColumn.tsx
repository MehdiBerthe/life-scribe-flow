import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { 
  DemartiniSession, 
  DemartiniAnswer, 
  ColumnConfig, 
  DemartiniColumn as DemartiniColumnType,
  CertaintyCheck,
  BLOCKED_WORDS,
  CRISIS_KEYWORDS
} from '@/types/demartini';

interface DemartiniColumnProps {
  config: ColumnConfig;
  session: DemartiniSession;
  onSessionUpdate: (session: DemartiniSession) => void;
  onNextColumn: () => void;
  onPreviousColumn: () => void;
}

export function DemartiniColumn({ 
  config, 
  session, 
  onSessionUpdate, 
  onNextColumn, 
  onPreviousColumn 
}: DemartiniColumnProps) {
  const [answers, setAnswers] = useState<DemartiniAnswer[]>([]);
  const [certaintyCheck, setCertaintyCheck] = useState<CertaintyCheck | null>(null);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);

  const currentColumn = session.columns[config.number.toString()];

  useEffect(() => {
    if (currentColumn) {
      setAnswers(currentColumn.answers || []);
      setCertaintyCheck(currentColumn.certainty_check || null);
    } else {
      setAnswers([{ index: 1, text: '', who: '', where: '', when: '' }]);
      setCertaintyCheck(null);
    }
  }, [currentColumn, config.number]);

  const validateAnswer = (answer: DemartiniAnswer): string[] => {
    const errors: string[] = [];
    
    if (!answer.text.trim()) {
      errors.push('Answer text is required');
      return errors;
    }

    // Check for blocked words
    const words = answer.text.toLowerCase().split(/\s+/);
    const blockedFound = words.filter(word => BLOCKED_WORDS.includes(word));
    if (blockedFound.length > 0) {
      errors.push(`Avoid vague words: ${blockedFound.join(', ')}. Be more specific.`);
    }

    // Check for crisis keywords
    const crisisFound = CRISIS_KEYWORDS.some(keyword => 
      answer.text.toLowerCase().includes(keyword.toLowerCase())
    );
    if (crisisFound) {
      setShowCrisisAlert(true);
    }

    // Check for who/where/when requirements
    if (config.requires_who_where_when) {
      if (!answer.who && !answer.where && !answer.when) {
        errors.push('Please provide at least one of: who, where, or when');
      }
    }

    return errors;
  };

  const addAnswer = () => {
    const newAnswer: DemartiniAnswer = {
      index: answers.length + 1,
      text: '',
      who: config.requires_who_where_when ? '' : undefined,
      where: config.requires_who_where_when ? '' : undefined,
      when: config.requires_who_where_when ? '' : undefined,
    };
    setAnswers([...answers, newAnswer]);
  };

  const updateAnswer = (index: number, field: keyof DemartiniAnswer, value: string) => {
    setAnswers(prev => prev.map(answer => 
      answer.index === index ? { ...answer, [field]: value } : answer
    ));
  };

  const removeAnswer = (index: number) => {
    if (answers.length > 1) {
      setAnswers(prev => prev.filter(answer => answer.index !== index)
        .map((answer, i) => ({ ...answer, index: i + 1 })));
    }
  };

  const validateAllAnswers = (): boolean => {
    let hasErrors = false;
    
    for (const answer of answers) {
      const errors = validateAnswer(answer);
      if (errors.length > 0) {
        toast.error(`Answer ${answer.index}: ${errors[0]}`);
        hasErrors = true;
        break;
      }
    }

    if (config.target_count && answers.filter(a => a.text.trim()).length < config.target_count) {
      toast.error(`This column requires at least ${config.target_count} answers`);
      hasErrors = true;
    }

    return !hasErrors;
  };

  const saveColumn = () => {
    if (!validateAllAnswers()) return;

    const columnData: DemartiniColumnType = {
      column_number: config.number,
      answers: answers.filter(a => a.text.trim()),
      certainty_check: certaintyCheck,
      target_count: config.target_count,
      is_complete: config.number === 1 ? targetMet : Boolean(certaintyCheck?.is_certain),
    };

    const updatedSession: DemartiniSession = {
      ...session,
      columns: {
        ...session.columns,
        [config.number.toString()]: columnData,
      },
      progress: {
        ...session.progress,
        completed_columns: columnData.is_complete 
          ? [...new Set([...session.progress.completed_columns, config.number])]
          : session.progress.completed_columns.filter(n => n !== config.number),
      },
    };

    onSessionUpdate(updatedSession);
    toast.success('Column saved successfully');
  };

  const completeCertaintyCheck = (is_certain: boolean, note: string) => {
    const certainty: CertaintyCheck = {
      is_certain,
      note: note.trim(),
      timestamp: new Date().toISOString(),
    };
    
    setCertaintyCheck(certainty);
    
    // Auto-save when certainty check is completed
    setTimeout(() => {
      const columnData: DemartiniColumnType = {
        column_number: config.number,
        answers: answers.filter(a => a.text.trim()),
        certainty_check: certainty,
        target_count: config.target_count,
        is_complete: is_certain,
      };

      const updatedSession: DemartiniSession = {
        ...session,
        columns: {
          ...session.columns,
          [config.number.toString()]: columnData,
        },
        progress: {
          ...session.progress,
          completed_columns: is_certain 
            ? [...new Set([...session.progress.completed_columns, config.number])]
            : session.progress.completed_columns.filter(n => n !== config.number),
        },
      };

      onSessionUpdate(updatedSession);
    }, 100);
  };

  const getAnswerCount = () => answers.filter(a => a.text.trim()).length;
  const isComplete = currentColumn?.is_complete || false;
  const targetMet = !config.target_count || getAnswerCount() >= config.target_count;
  const canProceed = config.number === 1 ? targetMet : isComplete;

  return (
    <div className="space-y-6">
      {showCrisisAlert && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">
            <strong>Crisis Support Notice:</strong> If you're experiencing thoughts of self-harm or violence, 
            please reach out for help immediately. Contact a crisis hotline, mental health professional, 
            or emergency services. Your safety and wellbeing matter.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Column {config.number}: {config.title}
                {isComplete && <CheckCircle className="h-5 w-5 text-green-500" />}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={config.side === 'A' ? 'default' : config.side === 'B' ? 'secondary' : 'outline'}>
                  Side {config.side}
                </Badge>
                {config.mode && (
                  <Badge variant="outline">{config.mode.toUpperCase()}</Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {getAnswerCount()} answer{getAnswerCount() !== 1 ? 's' : ''}
                  {config.target_count && ` (target: ${config.target_count})`}
                </span>
                {targetMet && <CheckCircle className="h-4 w-4 text-green-500" />}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Question:</p>
            <p className="text-sm">{config.question}</p>
          </div>

          <div className="space-y-4">
            {answers.map((answer) => (
              <Card key={answer.index} className="border-l-4 border-l-primary/20">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <Label className="text-sm font-medium">Answer {answer.index}</Label>
                    {answers.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAnswer(answer.index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Textarea
                        placeholder="Write your specific answer here..."
                        value={answer.text}
                        onChange={(e) => updateAnswer(answer.index, 'text', e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    {config.requires_who_where_when && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Who</Label>
                          <Input
                            placeholder="Who was involved?"
                            value={answer.who || ''}
                            onChange={(e) => updateAnswer(answer.index, 'who', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Where</Label>
                          <Input
                            placeholder="Where did this happen?"
                            value={answer.where || ''}
                            onChange={(e) => updateAnswer(answer.index, 'where', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">When</Label>
                          <Input
                            placeholder="When did this occur?"
                            value={answer.when || ''}
                            onChange={(e) => updateAnswer(answer.index, 'when', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={addAnswer}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Answer
          </Button>

          {(!config.target_count || getAnswerCount() >= config.target_count) && config.number !== 1 ? (
            <>
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Certainty Check</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Are you now certain about your answers for Column {config.number}?
                </p>
                
                {!certaintyCheck ? (
                  <CertaintyCheckForm onComplete={completeCertaintyCheck} />
                ) : (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {certaintyCheck.is_certain ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-orange-500" />
                      )}
                      <span className="font-medium">
                        {certaintyCheck.is_certain ? 'Certain' : 'Not Certain'}
                      </span>
                    </div>
                    <p className="text-sm">{certaintyCheck.note}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Completed: {new Date(certaintyCheck.timestamp).toLocaleString()}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCertaintyCheck(null)}
                      className="mt-2"
                    >
                      Redo Certainty Check
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : config.number === 1 && targetMet ? null : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please provide at least {config.target_count} answers before proceeding to the certainty check.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={onPreviousColumn}
              disabled={session.progress.current_column === 1}
            >
              Previous Column
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={saveColumn}>
                Save Progress
              </Button>
              
              {canProceed && (
                <Button onClick={onNextColumn}>
                  Next Column
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface CertaintyCheckFormProps {
  onComplete: (is_certain: boolean, note: string) => void;
}

function CertaintyCheckForm({ onComplete }: CertaintyCheckFormProps) {
  const [is_certain, setIsCertain] = useState<boolean | null>(null);
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (is_certain === null) {
      toast.error('Please select Yes or No');
      return;
    }
    
    if (!note.trim()) {
      toast.error('Please add a note explaining your certainty level');
      return;
    }
    
    onComplete(is_certain, note);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="certain-yes"
            checked={is_certain === true}
            onCheckedChange={() => setIsCertain(true)}
          />
          <Label htmlFor="certain-yes">Yes, I'm certain</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="certain-no"
            checked={is_certain === false}
            onCheckedChange={() => setIsCertain(false)}
          />
          <Label htmlFor="certain-no">No, I need more reflection</Label>
        </div>
      </div>
      
      <div>
        <Label htmlFor="certainty-note">Note (required)</Label>
        <Textarea
          id="certainty-note"
          placeholder="Explain why you are or aren't certain about these answers..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1"
        />
      </div>
      
      <Button onClick={handleSubmit} className="w-full">
        Complete Certainty Check
      </Button>
    </div>
  );
}