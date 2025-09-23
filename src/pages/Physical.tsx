import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { storage, generateId, formatDate, isToday } from '@/lib/storage';
import { PhysicalLog } from '@/types';
import { Activity, Plus, Edit3, Save, X, Moon, Dumbbell, Scale, Zap, Coffee, Utensils, Calendar, Clock, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Physical() {
  const [logs, setLogs] = useState<PhysicalLog[]>([]);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [formData, setFormData] = useState<Partial<PhysicalLog>>({
    sleep: { hours: undefined, quality: 3 },
    workout: { type: '', duration: undefined, intensity: 3, exercises: [] },
    weight: { value: 0 },
    energy: { level: 3 },
    caffeine: { cups: undefined },
    meals: [],
    totalCalories: undefined,
    notes: ''
  });

  useEffect(() => {
    const loadedLogs = storage.physicalLogs.getAll();
    setLogs(loadedLogs.sort((a, b) => b.date.getTime() - a.date.getTime()));
  }, []);

  const getTodayLog = () => {
    return logs.find(log => isToday(log.date));
  };

  const createOrEditLog = (logToEdit?: PhysicalLog) => {
    if (logToEdit) {
      setFormData({
        sleep: logToEdit.sleep || { quality: 3 },
        workout: logToEdit.workout || { intensity: 3, exercises: [] },
        weight: logToEdit.weight || { value: 0 },
        energy: logToEdit.energy || { level: 3 },
        caffeine: logToEdit.caffeine || {},
        meals: logToEdit.meals || [],
        totalCalories: logToEdit.totalCalories,
        notes: logToEdit.notes || ''
      });
      setEditingLogId(logToEdit.id);
    } else {
      // Create new log for today
      setFormData({
        sleep: { quality: 3 },
        workout: { intensity: 3, exercises: [] },
        weight: { value: 0 },
        energy: { level: 3 },
        caffeine: {},
        meals: [],
        totalCalories: undefined,
        notes: ''
      });
      setEditingLogId(null);
    }
    setShowCreateForm(true);
  };

  const addExercise = () => {
    const newExercise = {
      id: generateId(),
      name: '',
      sets: []
    };
    
    setFormData(prev => ({
      ...prev,
      workout: { 
        ...prev.workout, 
        exercises: [...(prev.workout?.exercises || []), newExercise] 
      }
    }));
  };

  const updateExercise = (exerciseId: string, updates: { name?: string }) => {
    setFormData(prev => ({
      ...prev,
      workout: {
        ...prev.workout,
        exercises: prev.workout?.exercises?.map(exercise => 
          exercise.id === exerciseId ? { ...exercise, ...updates } : exercise
        ) || []
      }
    }));
  };

  const removeExercise = (exerciseId: string) => {
    setFormData(prev => ({
      ...prev,
      workout: {
        ...prev.workout,
        exercises: prev.workout?.exercises?.filter(exercise => exercise.id !== exerciseId) || []
      }
    }));
  };

  const addSet = (exerciseId: string) => {
    const newSet = {
      id: generateId(),
      reps: 0,
      weight: undefined,
      notes: ''
    };
    
    setFormData(prev => ({
      ...prev,
      workout: {
        ...prev.workout,
        exercises: prev.workout?.exercises?.map(exercise => 
          exercise.id === exerciseId 
            ? { ...exercise, sets: [...exercise.sets, newSet] }
            : exercise
        ) || []
      }
    }));
  };

  const updateSet = (exerciseId: string, setId: string, updates: { reps?: number; weight?: number; notes?: string }) => {
    setFormData(prev => ({
      ...prev,
      workout: {
        ...prev.workout,
        exercises: prev.workout?.exercises?.map(exercise => 
          exercise.id === exerciseId 
            ? {
                ...exercise,
                sets: exercise.sets.map(set => 
                  set.id === setId ? { ...set, ...updates } : set
                )
              }
            : exercise
        ) || []
      }
    }));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setFormData(prev => ({
      ...prev,
      workout: {
        ...prev.workout,
        exercises: prev.workout?.exercises?.map(exercise => 
          exercise.id === exerciseId 
            ? { ...exercise, sets: exercise.sets.filter(set => set.id !== setId) }
            : exercise
        ) || []
      }
    }));
  };

  const addMeal = () => {
    const newMeal = {
      id: generateId(),
      time: new Date().toTimeString().slice(0, 5),
      type: 'breakfast' as const,
      description: '',
      calories: undefined
    };
    
    setFormData(prev => ({
      ...prev,
      meals: [...(prev.meals || []), newMeal]
    }));
  };

  const updateMeal = (mealId: string, updates: Partial<typeof formData.meals[0]>) => {
    setFormData(prev => ({
      ...prev,
      meals: prev.meals?.map(meal => 
        meal.id === mealId ? { ...meal, ...updates } : meal
      ) || []
    }));
  };

  const removeMeal = (mealId: string) => {
    setFormData(prev => ({
      ...prev,
      meals: prev.meals?.filter(meal => meal.id !== mealId) || []
    }));
  };

  const calculateTotalCalories = () => {
    const mealCalories = formData.meals?.reduce((total, meal) => 
      total + (meal.calories || 0), 0) || 0;
    return mealCalories;
  };

  const saveLog = () => {
    if (!formData.sleep?.hours && !formData.workout?.type && !formData.weight?.value && 
        !formData.meals?.length && !formData.notes?.trim()) {
      toast({
        title: "Nothing to Save",
        description: "Please add at least one entry before saving.",
        variant: "destructive"
      });
      return;
    }

    const totalCalories = calculateTotalCalories();
    
    if (editingLogId) {
      // Update existing log
      const updatedLogs = logs.map(log => 
        log.id === editingLogId 
          ? {
              ...log,
              ...formData,
              totalCalories,
              updatedAt: new Date()
            } as PhysicalLog
          : log
      );
      setLogs(updatedLogs);
      storage.physicalLogs.save(updatedLogs);
      
      toast({
        title: "Log Updated",
        description: "Your daily log has been updated successfully."
      });
    } else {
      // Create new log
      const newLog: PhysicalLog = {
        id: generateId(),
        date: new Date(),
        ...formData,
        totalCalories,
        createdAt: new Date(),
        updatedAt: new Date()
      } as PhysicalLog;

      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      storage.physicalLogs.save(updatedLogs);
      
      toast({
        title: "Log Created",
        description: "Your daily log has been created successfully."
      });
    }

    cancelForm();
  };

  const cancelForm = () => {
    setShowCreateForm(false);
    setEditingLogId(null);
    setFormData({
      sleep: { quality: 3 },
      workout: { intensity: 3, exercises: [] },
      weight: { value: 0 },
      energy: { level: 3 },
      caffeine: {},
      meals: [],
      totalCalories: undefined,
      notes: ''
    });
  };

  const getMealTypeIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return '🥐';
      case 'lunch': return '🥗';
      case 'dinner': return '🍽️';
      case 'snack': return '🍎';
      default: return '🍽️';
    }
  };

  const getQualityLabel = (value: number) => {
    const labels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return labels[value - 1] || 'Good';
  };

  const getIntensityLabel = (value: number) => {
    const labels = ['Light', 'Easy', 'Moderate', 'Hard', 'Very Hard'];
    return labels[value - 1] || 'Moderate';
  };

  const getEnergyLabel = (value: number) => {
    const labels = ['Very Low', 'Low', 'Normal', 'High', 'Very High'];
    return labels[value - 1] || 'Normal';
  };

  const todayLog = getTodayLog();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-foreground" />
          <h1 className="text-3xl font-bold text-foreground">Physical Logs</h1>
        </div>
        <div className="flex items-center gap-2">
          {todayLog ? (
            <Button onClick={() => createOrEditLog(todayLog)} className="flex items-center gap-2">
              <Edit3 size={16} />
              Edit Today's Log
            </Button>
          ) : (
            <Button onClick={() => createOrEditLog()} className="flex items-center gap-2">
              <Plus size={16} />
              Create Today's Log
            </Button>
          )}
        </div>
      </div>

      {/* Today's Quick Overview */}
      {todayLog && (
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {todayLog.sleep?.hours && (
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <Moon className="h-6 w-6 mx-auto text-blue-500 mb-1" />
                  <div className="text-sm font-medium">{todayLog.sleep.hours}h sleep</div>
                  <div className="text-xs text-muted-foreground">{getQualityLabel(todayLog.sleep.quality || 3)}</div>
                </div>
              )}
              
              {todayLog.workout?.type && (
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <Dumbbell className="h-6 w-6 mx-auto text-orange-500 mb-1" />
                  <div className="text-sm font-medium">{todayLog.workout.duration}min</div>
                  <div className="text-xs text-muted-foreground">{todayLog.workout.type}</div>
                </div>
              )}
              
              {todayLog.weight?.value && (
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <Scale className="h-6 w-6 mx-auto text-green-500 mb-1" />
                  <div className="text-sm font-medium">{todayLog.weight.value}kg</div>
                  <div className="text-xs text-muted-foreground">Weight</div>
                </div>
              )}
              
              {todayLog.totalCalories && (
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <Utensils className="h-6 w-6 mx-auto text-purple-500 mb-1" />
                  <div className="text-sm font-medium">{todayLog.totalCalories} cal</div>
                  <div className="text-xs text-muted-foreground">{todayLog.meals?.length || 0} meals</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{editingLogId ? 'Edit' : 'Create'} Daily Log</span>
              <Button variant="ghost" size="sm" onClick={cancelForm}>
                <X size={16} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="basics" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basics">Basics</TabsTrigger>
                <TabsTrigger value="meals">Meals</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="basics" className="space-y-4">
                {/* Sleep */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Moon className="h-4 w-4 text-blue-500" />
                      Sleep
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Hours slept</label>
                      <Input
                        type="number"
                        step="0.5"
                        value={formData.sleep?.hours || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          sleep: { ...prev.sleep, hours: parseFloat(e.target.value) || undefined }
                        }))}
                        placeholder="e.g., 7.5"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Sleep Quality: {getQualityLabel(formData.sleep?.quality || 3)}
                      </label>
                      <Slider
                        value={[formData.sleep?.quality || 3]}
                        onValueChange={([value]) => setFormData(prev => ({
                          ...prev,
                          sleep: { ...prev.sleep, quality: value }
                        }))}
                        max={5}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Sleep Notes</label>
                      <Input
                        value={formData.sleep?.notes || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          sleep: { ...prev.sleep, notes: e.target.value }
                        }))}
                        placeholder="How was your sleep?"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Workout */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-orange-500" />
                      Workout
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Workout Type</label>
                        <Input
                          value={formData.workout?.type || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            workout: { ...prev.workout, type: e.target.value }
                          }))}
                          placeholder="e.g., Upper Body, Legs, Cardio"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Duration (minutes)</label>
                        <Input
                          type="number"
                          value={formData.workout?.duration || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            workout: { ...prev.workout, duration: parseInt(e.target.value) || undefined }
                          }))}
                          placeholder="e.g., 45"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Intensity: {getIntensityLabel(formData.workout?.intensity || 3)}
                      </label>
                      <Slider
                        value={[formData.workout?.intensity || 3]}
                        onValueChange={([value]) => setFormData(prev => ({
                          ...prev,
                          workout: { ...prev.workout, intensity: value }
                        }))}
                        max={5}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Exercises</label>
                        <Button onClick={addExercise} size="sm" variant="outline" className="flex items-center gap-1">
                          <Plus size={14} />
                          Add Exercise
                        </Button>
                      </div>
                      
                      {formData.workout?.exercises?.map((exercise, exerciseIndex) => (
                        <Card key={exercise.id} className="border-l-4 border-l-orange-500/50">
                          <CardContent className="pt-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <Input
                                value={exercise.name}
                                onChange={(e) => updateExercise(exercise.id, { name: e.target.value })}
                                placeholder="Exercise name (e.g., Bench Press, Squats)"
                                className="flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeExercise(exercise.id)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Sets</span>
                                <Button 
                                  onClick={() => addSet(exercise.id)} 
                                  size="sm" 
                                  variant="ghost"
                                  className="flex items-center gap-1"
                                >
                                  <Plus size={12} />
                                  Add Set
                                </Button>
                              </div>
                              
                              {exercise.sets.map((set, setIndex) => (
                                <div key={set.id} className="grid grid-cols-4 gap-2 items-center bg-muted/30 p-2 rounded">
                                  <div className="text-xs text-center font-medium">Set {setIndex + 1}</div>
                                  <Input
                                    type="number"
                                    value={set.reps || ''}
                                    onChange={(e) => updateSet(exercise.id, set.id, { reps: parseInt(e.target.value) || 0 })}
                                    placeholder="Reps"
                                    className="text-xs"
                                  />
                                  <Input
                                    type="number"
                                    step="0.5"
                                    value={set.weight || ''}
                                    onChange={(e) => updateSet(exercise.id, set.id, { weight: parseFloat(e.target.value) || undefined })}
                                    placeholder="Weight (kg)"
                                    className="text-xs"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSet(exercise.id, set.id)}
                                  >
                                    <X size={12} />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Workout Notes</label>
                      <Input
                        value={formData.workout?.notes || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          workout: { ...prev.workout, notes: e.target.value }
                        }))}
                        placeholder="How did it go? Personal records?"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Weight & Other Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Scale className="h-4 w-4 text-green-500" />
                        Weight
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Weight (kg)</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.weight?.value || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            weight: { ...prev.weight, value: parseFloat(e.target.value) || 0 }
                          }))}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Energy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <label className="text-sm font-medium mb-2 block">
                        Energy Level: {getEnergyLabel(formData.energy?.level || 3)}
                      </label>
                      <Slider
                        value={[formData.energy?.level || 3]}
                        onValueChange={([value]) => setFormData(prev => ({
                          ...prev,
                          energy: { ...prev.energy, level: value }
                        }))}
                        max={5}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Coffee className="h-4 w-4 text-amber-600" />
                        Caffeine
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <label className="text-sm font-medium">Cups of coffee</label>
                      <Input
                        type="number"
                        value={formData.caffeine?.cups || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          caffeine: { ...prev.caffeine, cups: parseInt(e.target.value) || undefined }
                        }))}
                        placeholder="0"
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="meals" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Meals & Nutrition</h3>
                  <Button onClick={addMeal} size="sm" className="flex items-center gap-1">
                    <Plus size={14} />
                    Add Meal
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.meals?.map((meal, index) => (
                    <Card key={meal.id} className="border-l-4 border-l-primary/50">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                          <div>
                            <label className="text-xs font-medium">Time</label>
                            <Input
                              type="time"
                              value={meal.time}
                              onChange={(e) => updateMeal(meal.id, { time: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium">Type</label>
                            <select
                              value={meal.type}
                              onChange={(e) => updateMeal(meal.id, { type: e.target.value as any })}
                              className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                            >
                              <option value="breakfast">Breakfast</option>
                              <option value="lunch">Lunch</option>
                              <option value="dinner">Dinner</option>
                              <option value="snack">Snack</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs font-medium">Description</label>
                            <Input
                              value={meal.description}
                              onChange={(e) => updateMeal(meal.id, { description: e.target.value })}
                              placeholder="What did you eat?"
                            />
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="text-xs font-medium">Calories</label>
                              <Input
                                type="number"
                                value={meal.calories || ''}
                                onChange={(e) => updateMeal(meal.id, { calories: parseInt(e.target.value) || undefined })}
                                placeholder="0"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMeal(meal.id)}
                              className="mt-auto"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {formData.meals && formData.meals.length > 0 && (
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {calculateTotalCalories()} calories
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total from {formData.meals.length} meal{formData.meals.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="notes">
                <div>
                  <label className="text-sm font-medium mb-2 block">Daily Notes</label>
                  <Textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="How are you feeling? Any observations about your health, energy, or habits today?"
                    rows={6}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={saveLog} className="flex items-center gap-2">
                <Save size={16} />
                {editingLogId ? 'Update' : 'Create'} Log
              </Button>
              <Button variant="outline" onClick={cancelForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Previous Logs */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Previous Logs</h2>
        
        {logs.length === 0 ? (
          <Card>
            <CardContent className="pt-12">
              <div className="text-center">
                <Activity size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No logs yet</h3>
                <p className="text-muted-foreground">Start tracking your daily physical activities and health metrics.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          logs.map((log) => (
            <Card key={log.id} className={isToday(log.date) ? "border-primary/50 bg-primary/5" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {formatDate(log.date)}
                    {isToday(log.date) && <Badge variant="secondary">Today</Badge>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => createOrEditLog(log)}
                    className="flex items-center gap-1"
                  >
                    <Edit3 size={14} />
                    Edit
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {log.sleep?.hours && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <Moon className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-medium">{log.sleep.hours}h sleep</div>
                        <div className="text-xs text-muted-foreground">{getQualityLabel(log.sleep.quality || 3)}</div>
                      </div>
                    </div>
                  )}
                  
                  {log.workout?.type && (
                    <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                      <Dumbbell className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="font-medium">{log.workout.type}</div>
                        <div className="text-xs text-muted-foreground">
                          {log.workout.duration && `${log.workout.duration}min • `}{getIntensityLabel(log.workout.intensity || 3)}
                          {log.workout.exercises && log.workout.exercises.length > 0 && ` • ${log.workout.exercises.length} exercises`}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {log.weight?.value && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <Scale className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">{log.weight.value}kg</div>
                      </div>
                    </div>
                  )}
                  
                  {log.totalCalories && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                      <Utensils className="h-5 w-5 text-purple-500" />
                      <div>
                        <div className="font-medium">{log.totalCalories} cal</div>
                        <div className="text-xs text-muted-foreground">
                          {log.meals?.length || 0} meal{(log.meals?.length || 0) !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {log.workout?.exercises && log.workout.exercises.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Dumbbell className="h-4 w-4" />
                      Exercises
                    </h4>
                    <div className="space-y-2">
                      {log.workout.exercises.map((exercise) => (
                        <div key={exercise.id} className="p-3 bg-muted/30 rounded-md">
                          <div className="font-medium text-sm mb-2">{exercise.name}</div>
                          {exercise.sets.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 text-xs">
                              {exercise.sets.map((set, index) => (
                                <div key={set.id} className="bg-background/50 p-1 rounded text-center">
                                  Set {index + 1}: {set.reps} reps
                                  {set.weight && ` @ ${set.weight}kg`}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {log.meals && log.meals.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Utensils className="h-4 w-4" />
                      Meals
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {log.meals.map((meal) => (
                        <div key={meal.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-md">
                          <span className="text-lg">{getMealTypeIcon(meal.type)}</span>
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {meal.time} • {meal.type}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {meal.description}
                              {meal.calories && ` • ${meal.calories} cal`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {log.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium text-foreground mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground">{log.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}