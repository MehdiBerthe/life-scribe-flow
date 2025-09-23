import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Save, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DemartiniColumn as DemartiniColumnComponent } from './DemartiniColumn';
import { 
  DemartiniSession, 
  DEMARTINI_COLUMNS, 
  DEMARTINI_COLUMNS_SIDE_C,
  ColumnConfig 
} from '@/types/demartini';

export function DemartiniGuide() {
  const [sessions, setSessions] = useState<DemartiniSession[]>([]);
  const [currentSession, setCurrentSession] = useState<DemartiniSession | null>(null);
  const [showNewSession, setShowNewSession] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [sideCMode, setSideCMode] = useState<'self' | 'relief' | 'grief'>('self');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('demartini_docs')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const formattedSessions: DemartiniSession[] = data?.map(doc => ({
        id: doc.id,
        title: doc.title,
        side_c_mode: doc.side_c_mode as 'self' | 'relief' | 'grief',
        columns: (doc.data as any)?.columns || {},
        progress: (doc.progress as any) || { current_column: 1, completed_columns: [] },
        created_at: doc.created_at,
        updated_at: doc.updated_at,
      })) || [];

      setSessions(formattedSessions);
    } catch (error: any) {
      toast.error('Failed to load sessions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = async () => {
    if (!newSessionTitle.trim()) {
      toast.error('Please enter a session title');
      return;
    }

    setLoading(true);
    try {
      const newSession: Partial<DemartiniSession> = {
        title: newSessionTitle.trim(),
        side_c_mode: sideCMode,
        columns: {},
        progress: { current_column: 1, completed_columns: [] },
      };

      const { data, error } = await supabase
        .from('demartini_docs')
        .insert({
          title: newSession.title!,
          side_c_mode: newSession.side_c_mode,
          data: { columns: newSession.columns } as any,
          progress: newSession.progress as any,
        })
        .select()
        .single();

      if (error) throw error;

      const createdSession: DemartiniSession = {
        id: data.id,
        title: data.title,
        side_c_mode: data.side_c_mode as 'self' | 'relief' | 'grief',
        columns: (data.data as any)?.columns || {},
        progress: (data.progress as any) || { current_column: 1, completed_columns: [] },
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      setSessions(prev => [createdSession, ...prev]);
      setCurrentSession(createdSession);
      setShowNewSession(false);
      setNewSessionTitle('');
      toast.success('New session created');
    } catch (error: any) {
      toast.error('Failed to create session: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSession = async (session: DemartiniSession) => {
    try {
      const { error } = await supabase
        .from('demartini_docs')
        .update({
          data: { columns: session.columns } as any,
          progress: session.progress as any,
        })
        .eq('id', session.id);

      if (error) throw error;
      
      setSessions(prev => prev.map(s => s.id === session.id ? session : s));
      toast.success('Session saved');
    } catch (error: any) {
      toast.error('Failed to save session: ' + error.message);
    }
  };

  const getAllColumns = (mode?: string): ColumnConfig[] => {
    const baseColumns = DEMARTINI_COLUMNS;
    if (!mode) return baseColumns;
    
    const sideCColumns = DEMARTINI_COLUMNS_SIDE_C[mode] || [];
    return [...baseColumns, ...sideCColumns];
  };

  const getCurrentColumn = (session: DemartiniSession): ColumnConfig | null => {
    const allColumns = getAllColumns(session.side_c_mode);
    return allColumns.find(col => col.number === session.progress.current_column) || null;
  };

  const getProgress = (session: DemartiniSession): number => {
    const allColumns = getAllColumns(session.side_c_mode);
    return (session.progress.completed_columns.length / allColumns.length) * 100;
  };

  const exportSession = (session: DemartiniSession) => {
    const exportData = {
      title: session.title,
      created_at: session.created_at,
      side_c_mode: session.side_c_mode,
      columns: session.columns,
      progress: session.progress,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `demartini-${session.title.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Session exported');
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sessions...</p>
        </div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Demartini Method Guide</h1>
          <p className="text-muted-foreground">
            A structured reflection process to balance emotional charges and gain clarity through systematic questioning.
          </p>
        </div>

        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This is a personal development tool. If you experience thoughts of self-harm during this process, 
            please reach out to a mental health professional immediately.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No sessions yet. Create your first Demartini reflection session.
                </p>
              ) : (
                sessions.map(session => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{session.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Mode: {session.side_c_mode?.toUpperCase()} • {Math.round(getProgress(session))}% complete
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Updated: {new Date(session.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportSession(session)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setCurrentSession(session)}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                ))
              )}

              {!showNewSession ? (
                <Button onClick={() => setShowNewSession(true)} className="w-full">
                  Create New Session
                </Button>
              ) : (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <Label htmlFor="sessionTitle">Session Title</Label>
                      <Input
                        id="sessionTitle"
                        value={newSessionTitle}
                        onChange={(e) => setNewSessionTitle(e.target.value)}
                        placeholder="e.g., 'Reflection on Mom', 'Work Conflict with John'"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sideC">Side C Mode</Label>
                      <Select value={sideCMode} onValueChange={(value: 'self' | 'relief' | 'grief') => setSideCMode(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="self">Self (trait changes in yourself)</SelectItem>
                          <SelectItem value="relief">Relief (new person arrives)</SelectItem>
                          <SelectItem value="grief">Grief (person leaves)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={createNewSession} disabled={loading}>
                        Create Session
                      </Button>
                      <Button variant="outline" onClick={() => setShowNewSession(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentColumn = getCurrentColumn(currentSession);
  const allColumns = getAllColumns(currentSession.side_c_mode);
  const progress = getProgress(currentSession);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{currentSession.title}</h1>
            <p className="text-muted-foreground">
              Mode: {currentSession.side_c_mode?.toUpperCase()} • Column {currentSession.progress.current_column} of {allColumns.length}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => saveSession(currentSession)}
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentSession(null)}
            >
              Back to Sessions
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {currentColumn && (
        <DemartiniColumnComponent
          config={currentColumn}
          session={currentSession}
          onSessionUpdate={(updatedSession) => {
            setCurrentSession(updatedSession);
            saveSession(updatedSession);
          }}
          onNextColumn={() => {
            const nextColumnNumber = currentSession.progress.current_column + 1;
            const nextColumn = allColumns.find(col => col.number === nextColumnNumber);
            
            if (nextColumn) {
              const updatedSession = {
                ...currentSession,
                progress: {
                  ...currentSession.progress,
                  current_column: nextColumnNumber,
                },
              };
              setCurrentSession(updatedSession);
              saveSession(updatedSession);
            } else {
              toast.success('Congratulations! You have completed all columns.');
            }
          }}
          onPreviousColumn={() => {
            if (currentSession.progress.current_column > 1) {
              const updatedSession = {
                ...currentSession,
                progress: {
                  ...currentSession.progress,
                  current_column: currentSession.progress.current_column - 1,
                },
              };
              setCurrentSession(updatedSession);
            }
          }}
        />
      )}
    </div>
  );
}