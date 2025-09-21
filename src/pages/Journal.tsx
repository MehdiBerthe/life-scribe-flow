import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { NotebookPage } from '@/components/NotebookPage';
import { storage, generateId, formatDate, formatTime } from '@/lib/storage';
import { JournalEntry, JOURNAL_AREAS } from '@/types';
import { PenTool, Plus, Tag } from 'lucide-react';
import { indexForRag } from '@/lib/rag';

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    area: '',
    title: '',
    content: '',
    tags: ''
  });

  useEffect(() => {
    const loadedEntries = storage.journal.getAll();
    const sortedEntries = loadedEntries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    setEntries(sortedEntries);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newEntry: JournalEntry = {
      id: generateId(),
      createdAt: new Date(),
      area: formData.area || undefined,
      title: formData.title || undefined,
      content: formData.content,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined
    };

    const updatedEntries = [newEntry, ...entries];
    setEntries(updatedEntries);
    storage.journal.save(updatedEntries);

    // Index for RAG
    await indexForRag({
      userId: 'single-user',
      kind: 'journal',
      refId: newEntry.id,
      title: newEntry.title,
      content: newEntry.content,
      metadata: {
        area: newEntry.area,
        tags: newEntry.tags
      }
    });

    // Reset form
    setFormData({ area: '', title: '', content: '', tags: '' });
    setShowForm(false);
  };

  const getAreaColor = (area?: string) => {
    const colors: Record<string, string> = {
      'Physical': 'bg-red-100 text-red-800',
      'Mental': 'bg-blue-100 text-blue-800',
      'Emotional': 'bg-purple-100 text-purple-800',
      'Spiritual': 'bg-yellow-100 text-yellow-800',
      'Social': 'bg-green-100 text-green-800',
      'Professional': 'bg-indigo-100 text-indigo-800',
      'Financial': 'bg-pink-100 text-pink-800'
    };
    return area ? colors[area] || 'bg-muted text-muted-foreground' : '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PenTool className="h-6 w-6 text-ink" />
          <h1 className="text-3xl font-bold text-ink">Journal</h1>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          New Entry
        </Button>
      </div>

      {showForm && (
        <NotebookPage showLines>
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="text-ink">New Journal Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-ink">Life Area (optional)</label>
                    <Select value={formData.area} onValueChange={(value) => setFormData(prev => ({ ...prev, area: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select area..." />
                      </SelectTrigger>
                      <SelectContent>
                        {JOURNAL_AREAS.map(area => (
                          <SelectItem key={area} value={area}>{area}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-ink">Title (optional)</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Entry title..."
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-ink">Content</label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="What's on your mind..."
                    rows={6}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-ink">Tags (optional)</label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="tag1, tag2, tag3..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit">Save Entry</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </NotebookPage>
      )}

      {/* Journal Entries */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <NotebookPage showLines>
            <div className="text-center py-12">
              <PenTool size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-ink mb-2">No journal entries yet</h3>
              <p className="text-muted-foreground">Start writing to capture your thoughts and experiences.</p>
            </div>
          </NotebookPage>
        ) : (
          entries.map((entry) => (
            <NotebookPage key={entry.id} showLines>
              <Card className="border-0 bg-transparent shadow-none">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      {entry.title && (
                        <CardTitle className="text-ink text-lg mb-1">{entry.title}</CardTitle>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatDate(entry.createdAt)} at {formatTime(entry.createdAt)}</span>
                        {entry.area && (
                          <Badge className={getAreaColor(entry.area)}>
                            {entry.area}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-ink whitespace-pre-wrap leading-relaxed">
                      {entry.content}
                    </p>
                  </div>
                  
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-notebook-lines">
                      <Tag size={14} className="text-muted-foreground" />
                      <div className="flex gap-1 flex-wrap">
                        {entry.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </NotebookPage>
          ))
        )}
      </div>
    </div>
  );
}