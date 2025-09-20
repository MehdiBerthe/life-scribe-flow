import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { NotebookPage } from '@/components/NotebookPage';
import { storage, generateId, formatDate, formatTime, isToday } from '@/lib/storage';
import { PhysicalLog } from '@/types';
import { Activity, Plus, Moon, Dumbbell, Scale, Zap, Coffee, Calculator, Utensils } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const LOG_TYPES = [
  { value: 'sleep', label: 'Sleep', icon: Moon, unit: 'hours' },
  { value: 'workout', label: 'Workout', icon: Dumbbell, unit: 'minutes' },
  { value: 'weight', label: 'Weight', icon: Scale, unit: 'kg' },
  { value: 'energy', label: 'Energy', icon: Zap, unit: '1-10' },
  { value: 'caffeine', label: 'Caffeine', icon: Coffee, unit: 'mg' },
  { value: 'calories', label: 'Calories', icon: Calculator, unit: 'kcal' },
  { value: 'meal', label: 'Meal', icon: Utensils, unit: '' },
] as const;

export default function Physical() {
  const [logs, setLogs] = useState<PhysicalLog[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    kind: '' as PhysicalLog['kind'] | '',
    valueNum: '',
    notes: '',
    mealType: '' as 'one-meal' | 'multiple-meals' | '',
    mealDescription: ''
  });

  useEffect(() => {
    const loadedLogs = storage.physicalLogs.getAll();
    const sortedLogs = loadedLogs.sort((a, b) => b.date.getTime() - a.date.getTime());
    setLogs(sortedLogs);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.kind) return;

    const newLog: PhysicalLog = {
      id: generateId(),
      date: new Date(),
      kind: formData.kind,
      valueNum: formData.valueNum ? parseFloat(formData.valueNum) : undefined,
      notes: formData.notes.trim() || undefined,
      mealType: formData.kind === 'meal' && formData.mealType ? formData.mealType : undefined,
      mealDescription: formData.kind === 'meal' && formData.mealDescription.trim() ? formData.mealDescription.trim() : undefined
    };

    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    storage.physicalLogs.save(updatedLogs);

    // Reset form
    setFormData({ kind: '', valueNum: '', notes: '', mealType: '', mealDescription: '' });
    setShowForm(false);
    
    const logType = LOG_TYPES.find(type => type.value === formData.kind);
    toast({
      title: "Log Added",
      description: `${logType?.label} logged successfully.`
    });
  };

  const getLogIcon = (kind: PhysicalLog['kind']) => {
    const logType = LOG_TYPES.find(type => type.value === kind);
    return logType?.icon || Activity;
  };

  const getLogColor = (kind: PhysicalLog['kind']) => {
    const colors = {
      'sleep': 'bg-blue-100 text-blue-800',
      'workout': 'bg-red-100 text-red-800',
      'weight': 'bg-purple-100 text-purple-800',
      'energy': 'bg-yellow-100 text-yellow-800',
      'caffeine': 'bg-orange-100 text-orange-800',
      'calories': 'bg-green-100 text-green-800',
      'meal': 'bg-pink-100 text-pink-800'
    };
    return colors[kind] || 'bg-muted text-muted-foreground';
  };

  const getLogUnit = (kind: PhysicalLog['kind']) => {
    const logType = LOG_TYPES.find(type => type.value === kind);
    return logType?.unit || '';
  };

  const getTodayStats = () => {
    const todayLogs = logs.filter(log => isToday(log.date));
    const stats: Record<string, { count: number; lastValue?: number; total?: number }> = {};
    
    LOG_TYPES.forEach(type => {
      const typeLogs = todayLogs.filter(log => log.kind === type.value);
      stats[type.value] = {
        count: typeLogs.length,
        lastValue: typeLogs[0]?.valueNum,
        total: typeLogs.reduce((sum, log) => sum + (log.valueNum || 0), 0)
      };
    });
    
    return stats;
  };

  const todayStats = getTodayStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-ink" />
          <h1 className="text-3xl font-bold text-ink">Physical Logs</h1>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Add Log
        </Button>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        {LOG_TYPES.map((logType) => {
          const Icon = logType.icon;
          const stat = todayStats[logType.value];
          
          return (
            <NotebookPage key={logType.value}>
              <Card className="border-0 bg-transparent shadow-none">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <Icon className="h-8 w-8 mx-auto text-primary mb-2" />
                    <div className="text-lg font-bold text-ink">
                      {logType.value === 'meal' 
                        ? (stat.count > 0 ? `${stat.count} meal${stat.count > 1 ? 's' : ''}` : '—')
                        : (stat.lastValue !== undefined ? `${stat.lastValue} ${logType.unit}` : '—')
                      }
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {logType.label} Today
                    </div>
                    {stat.count > 1 && (
                      <div className="text-xs text-muted-foreground">
                        {stat.count} entries
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </NotebookPage>
          );
        })}
      </div>

      {/* Add Log Form */}
      {showForm && (
        <NotebookPage showLines>
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="text-ink">Add Physical Log</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-ink">Type</label>
                    <Select value={formData.kind} onValueChange={(value: PhysicalLog['kind']) => setFormData(prev => ({ ...prev, kind: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select log type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {LOG_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon size={16} />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {formData.kind !== 'meal' ? (
                    <div>
                      <label className="text-sm font-medium text-ink">
                        Value {formData.kind && `(${getLogUnit(formData.kind)})`}
                      </label>
                      <Input
                        type="number"
                        step={formData.kind === 'weight' ? '0.1' : formData.kind === 'energy' ? '1' : '0.01'}
                        min={formData.kind === 'energy' ? '1' : '0'}
                        max={formData.kind === 'energy' ? '10' : undefined}
                        value={formData.valueNum}
                        onChange={(e) => setFormData(prev => ({ ...prev, valueNum: e.target.value }))}
                        placeholder={formData.kind ? `Enter ${getLogUnit(formData.kind)}` : 'Select type first'}
                        disabled={!formData.kind}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-sm font-medium text-ink">Meal Pattern</label>
                      <Select value={formData.mealType} onValueChange={(value: 'one-meal' | 'multiple-meals') => setFormData(prev => ({ ...prev, mealType: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select meal pattern..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one-meal">One Meal (OMAD)</SelectItem>
                          <SelectItem value="multiple-meals">Multiple Meals</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Meal Description - only show for meal type */}
                {formData.kind === 'meal' && (
                  <div>
                    <label className="text-sm font-medium text-ink">What did you eat?</label>
                    <Textarea
                      value={formData.mealDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, mealDescription: e.target.value }))}
                      placeholder="Describe what you ate..."
                      rows={3}
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-ink">Notes (optional)</label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={!formData.kind}>Save Log</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </NotebookPage>
      )}

      {/* Physical Logs */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ink">Recent Logs</h2>
        
        {logs.length === 0 ? (
          <NotebookPage showLines>
            <div className="text-center py-12">
              <Activity size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-ink mb-2">No physical logs yet</h3>
              <p className="text-muted-foreground">Start tracking your physical health metrics.</p>
            </div>
          </NotebookPage>
        ) : (
          logs.slice(0, 50).map((log) => {
            const Icon = getLogIcon(log.kind);
            const logType = LOG_TYPES.find(type => type.value === log.kind);
            
            return (
              <NotebookPage key={log.id}>
                <Card className="border-0 bg-transparent shadow-none">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        <Icon size={20} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getLogColor(log.kind)}>
                            {logType?.label}
                          </Badge>
                          {log.kind === 'meal' ? (
                            <span className="font-medium text-ink">
                              {log.mealType === 'one-meal' ? 'One Meal (OMAD)' : 'Multiple Meals'}
                            </span>
                          ) : (
                            log.valueNum !== undefined && (
                              <span className="font-medium text-ink">
                                {log.valueNum} {getLogUnit(log.kind)}
                              </span>
                            )
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-2">
                          {formatDate(log.date)} at {formatTime(log.date)}
                        </div>
                        
                        {log.kind === 'meal' && log.mealDescription && (
                          <div className="bg-muted/30 rounded p-2 mb-2">
                            <h5 className="text-sm font-medium text-ink mb-1">What I ate:</h5>
                            <p className="text-sm text-ink whitespace-pre-wrap">
                              {log.mealDescription}
                            </p>
                          </div>
                        )}
                        
                        {log.notes && (
                          <p className="text-sm text-ink whitespace-pre-wrap">
                            {log.notes}
                          </p>
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
    </div>
  );
}