import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { NotebookPage } from '@/components/NotebookPage';
import { storage, generateId, formatDate, formatTime } from '@/lib/storage';
import { ReadingItem, ReadingNote, Flashcard, BOOK_CATEGORIES } from '@/types';
import { BookOpen, Plus, FileText, ExternalLink, Lightbulb, Edit, Brain, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { indexForRag } from '@/lib/rag';
import { supabase } from '@/integrations/supabase/client';

export default function Reading() {
  const [items, setItems] = useState<ReadingItem[]>([]);
  const [notes, setNotes] = useState<ReadingNote[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [showBookForm, setShowBookForm] = useState(false);
  const [editingBook, setEditingBook] = useState<ReadingItem | null>(null);
  const [showNoteForm, setShowNoteForm] = useState<string | null>(null);
  const [showFlashcardForm, setShowFlashcardForm] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [generatingFlashcards, setGeneratingFlashcards] = useState<string | null>(null);
  
  const [bookForm, setBookForm] = useState<{
    title: string;
    author: string;
    category: string;
    pdfUrl: string;
    status: ReadingItem['status'];
  }>({
    title: '',
    author: '',
    category: '',
    pdfUrl: '',
    status: 'queued'
  });
  
  const [noteForm, setNoteForm] = useState({
    content: ''
  });

  const [flashcardForm, setFlashcardForm] = useState({
    question: '',
    answer: ''
  });

  useEffect(() => {
    const loadedItems = storage.reading.getAll();
    const loadedNotes = storage.readingNotes.getAll();
    const loadedFlashcards = storage.flashcards.getAll();
    
    setItems(loadedItems.sort((a, b) => a.title.localeCompare(b.title)));
    setNotes(loadedNotes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    setFlashcards(loadedFlashcards.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
  }, []);

  const addBook = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookForm.title.trim()) return;

    const newItem: ReadingItem = {
      id: generateId(),
      title: bookForm.title.trim(),
      author: bookForm.author.trim() || undefined,
      category: bookForm.category.trim() || undefined,
      source: 'manual',
      status: bookForm.status,
      progressPct: bookForm.status === 'completed' ? 100 : bookForm.status === 'reading' ? 50 : 0,
      pdfUrl: bookForm.pdfUrl.trim() || undefined
    };

    const updatedItems = [...items, newItem];
    setItems(updatedItems.sort((a, b) => a.title.localeCompare(b.title)));
    storage.reading.save(updatedItems);

    setBookForm({ title: '', author: '', category: '', pdfUrl: '', status: 'queued' });
    setShowBookForm(false);
    setEditingBook(null);
    
    toast({
      title: "Book Added",
      description: `"${newItem.title}" added to your reading list.`
    });
  };

  const addNote = async (itemId: string) => {
    if (!noteForm.content.trim()) return;

    const newNote: ReadingNote = {
      id: generateId(),
      itemId,
      createdAt: new Date(),
      content: noteForm.content.trim()
    };

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    storage.readingNotes.save(updatedNotes);

    // Index for RAG
    const book = items.find(item => item.id === itemId);
    await indexForRag({
      userId: 'single-user',
      kind: 'reading_note',
      refId: newNote.id,
      title: book ? `Note: ${book.title}` : 'Reading Note',
      content: newNote.content,
      metadata: {
        book_title: book?.title,
        book_author: book?.author,
        book_category: book?.category
      }
    });

    setNoteForm({ content: '' });
    setShowNoteForm(null);
    
    toast({
      title: "Note Added",
      description: `Note added for "${book?.title}"`
    });
  };

  const updateBookStatus = (itemId: string, status: ReadingItem['status']) => {
    const updatedItems = items.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            status, 
            progressPct: status === 'completed' ? 100 : status === 'reading' ? 50 : 0 
          }
        : item
    );
    
    setItems(updatedItems);
    storage.reading.save(updatedItems);
    
    const book = items.find(item => item.id === itemId);
    toast({
      title: "Status Updated",
      description: `"${book?.title}" marked as ${status}`
    });
  };

  const editBook = (book: ReadingItem) => {
    setBookForm({
      title: book.title,
      author: book.author || '',
      category: book.category || '',
      pdfUrl: book.pdfUrl || '',
      status: book.status
    });
    setEditingBook(book);
    setShowBookForm(true);
  };

  const updateBook = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookForm.title.trim() || !editingBook) return;

    const updatedItems = items.map(item => 
      item.id === editingBook.id 
        ? {
            ...item,
            title: bookForm.title.trim(),
            author: bookForm.author.trim() || undefined,
            category: bookForm.category.trim() || undefined,
            pdfUrl: bookForm.pdfUrl.trim() || undefined,
            status: bookForm.status,
            progressPct: bookForm.status === 'completed' ? 100 : bookForm.status === 'reading' ? 50 : 0
          }
        : item
    );
    
    setItems(updatedItems.sort((a, b) => a.title.localeCompare(b.title)));
    storage.reading.save(updatedItems);

    setBookForm({ title: '', author: '', category: '', pdfUrl: '', status: 'queued' });
    setShowBookForm(false);
    setEditingBook(null);
    
    toast({
      title: "Book Updated",
      description: `"${bookForm.title}" has been updated.`
    });
  };

  const getStatusColor = (status: ReadingItem['status']) => {
    const colors = {
      'queued': 'bg-secondary text-secondary-foreground',
      'reading': 'bg-accent text-accent-foreground',
      'completed': 'bg-success text-success-foreground'
    };
    return colors[status];
  };

  const getItemNotes = (itemId: string) => {
    return notes.filter(note => note.itemId === itemId);
  };

  const getItemFlashcards = (itemId: string) => {
    return flashcards.filter(card => card.itemId === itemId);
  };

  const createFlashcard = (noteId: string, itemId: string) => {
    if (!flashcardForm.question.trim() || !flashcardForm.answer.trim()) return;

    const newFlashcard: Flashcard = {
      id: generateId(),
      noteId,
      itemId,
      question: flashcardForm.question.trim(),
      answer: flashcardForm.answer.trim(),
      createdAt: new Date(),
      timesReviewed: 0
    };

    const updatedFlashcards = [newFlashcard, ...flashcards];
    setFlashcards(updatedFlashcards);
    storage.flashcards.save(updatedFlashcards);

    setFlashcardForm({ question: '', answer: '' });
    setShowFlashcardForm(null);
    
    const book = items.find(item => item.id === itemId);
    toast({
      title: "Flashcard Created",
      description: `Flashcard added for "${book?.title}"`
    });
  };

  const startStudyMode = () => {
    if (flashcards.length === 0) {
      toast({
        title: "No Flashcards",
        description: "Create some flashcards first to start studying!",
        variant: "destructive"
      });
      return;
    }
    setStudyMode(true);
    setCurrentCardIndex(0);
    setShowAnswer(false);
  };

  const nextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    } else {
      setStudyMode(false);
      setCurrentCardIndex(0);
      setShowAnswer(false);
      toast({
        title: "Study Session Complete!",
        description: `You reviewed ${flashcards.length} flashcard${flashcards.length > 1 ? 's' : ''}.`
      });
    }
  };

  const markReviewed = () => {
    const updatedFlashcards = flashcards.map((card, idx) => 
      idx === currentCardIndex 
        ? { ...card, lastReviewed: new Date(), timesReviewed: card.timesReviewed + 1 }
        : card
    );
    setFlashcards(updatedFlashcards);
    storage.flashcards.save(updatedFlashcards);
    nextCard();
  };

  const generateFlashcardsWithAI = async (itemId: string) => {
    const book = items.find(item => item.id === itemId);
    const bookNotes = getItemNotes(itemId);
    
    if (bookNotes.length === 0) {
      toast({
        title: "No Notes Found",
        description: "Add a note for this book first to generate flashcards.",
        variant: "destructive"
      });
      return;
    }

    // Combine all notes for the book
    const noteContent = bookNotes.map(note => note.content).join('\n\n');

    setGeneratingFlashcards(itemId);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-flashcards', {
        body: {
          noteContent,
          bookTitle: book?.title || 'Unknown Book'
        }
      });

      if (error) {
        console.error('Error generating flashcards:', error);
        if (error.message?.includes('429')) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Too many requests. Please try again later.",
            variant: "destructive"
          });
        } else if (error.message?.includes('402')) {
          toast({
            title: "Credits Required",
            description: "Please add credits to your workspace to use AI features.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to generate flashcards. Please try again.",
            variant: "destructive"
          });
        }
        return;
      }

      // Create flashcards from AI response
      const newFlashcards: Flashcard[] = data.flashcards.map((card: { question: string; answer: string }) => ({
        id: generateId(),
        noteId: bookNotes[0].id, // Associate with first note
        itemId,
        question: card.question,
        answer: card.answer,
        createdAt: new Date(),
        timesReviewed: 0
      }));

      const updatedFlashcards = [...newFlashcards, ...flashcards];
      setFlashcards(updatedFlashcards);
      storage.flashcards.save(updatedFlashcards);

      toast({
        title: "Flashcards Generated!",
        description: `Created ${newFlashcards.length} flashcards for "${book?.title}"`
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to generate flashcards. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGeneratingFlashcards(null);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 mobile-container">
      {/* Study Mode */}
      {studyMode && flashcards.length > 0 && (
        <NotebookPage showLines>
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-ink flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Study Mode
                </CardTitle>
                <Badge variant="outline">
                  {currentCardIndex + 1} / {flashcards.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="min-h-[200px] flex flex-col justify-center">
                <div className="text-lg font-semibold mb-4 text-foreground">
                  Question:
                </div>
                <div className="text-base text-foreground mb-6 p-4 bg-muted/50 rounded-lg">
                  {flashcards[currentCardIndex].question}
                </div>

                {showAnswer && (
                  <div className="animate-in fade-in duration-300">
                    <div className="text-lg font-semibold mb-4 text-foreground">
                      Answer:
                    </div>
                    <div className="text-base text-foreground p-4 bg-accent/20 rounded-lg">
                      {flashcards[currentCardIndex].answer}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {!showAnswer ? (
                  <Button onClick={() => setShowAnswer(true)} className="w-full">
                    Show Answer
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={markReviewed} 
                      className="w-full sm:w-auto flex items-center gap-2"
                      variant="default"
                    >
                      <CheckCircle size={16} />
                      Got it
                    </Button>
                    <Button 
                      onClick={nextCard} 
                      variant="outline"
                      className="w-full sm:w-auto flex items-center gap-2"
                    >
                      <XCircle size={16} />
                      Need to review
                    </Button>
                  </>
                )}
                <Button 
                  onClick={() => {
                    setStudyMode(false);
                    setCurrentCardIndex(0);
                    setShowAnswer(false);
                  }} 
                  variant="ghost"
                  className="w-full sm:w-auto"
                >
                  Exit Study Mode
                </Button>
              </div>
            </CardContent>
          </Card>
        </NotebookPage>
      )}

      {!studyMode && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Reading List</h1>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {flashcards.length > 0 && (
                <Button 
                  onClick={startStudyMode}
                  variant="outline"
                  className="flex items-center gap-2 w-full sm:w-auto"
                  size="sm"
                >
                  <Brain size={16} />
                  Study Flashcards ({flashcards.length})
                </Button>
              )}
              <Button 
                onClick={() => setShowBookForm(!showBookForm)}
                className="flex items-center gap-2 w-full sm:w-auto"
                size="sm"
              >
                <Plus size={16} />
                Add Book
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Book Form */}
      {showBookForm && (
        <NotebookPage showLines>
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="text-ink">
                {editingBook ? 'Edit Book' : 'Add New Book'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingBook ? updateBook : addBook} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Title *</label>
                    <Input
                      value={bookForm.title}
                      onChange={(e) => setBookForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Book title..."
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground">Author</label>
                    <Input
                      value={bookForm.author}
                      onChange={(e) => setBookForm(prev => ({ ...prev, author: e.target.value }))}
                      placeholder="Author name..."
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Category</label>
                    <Select value={bookForm.category} onValueChange={(value) => setBookForm(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border z-50">
                        {BOOK_CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Status</label>
                    <Select value={bookForm.status} onValueChange={(value: ReadingItem['status']) => setBookForm(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border z-50">
                        <SelectItem value="queued">Queued</SelectItem>
                        <SelectItem value="reading">Reading</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">PDF/Link URL (optional)</label>
                  <Input
                    value={bookForm.pdfUrl}
                    onChange={(e) => setBookForm(prev => ({ ...prev, pdfUrl: e.target.value }))}
                    placeholder="https://..."
                    type="url"
                    className="mt-1"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="submit" className="w-full sm:w-auto">
                    {editingBook ? 'Update Book' : 'Add Book'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowBookForm(false);
                      setEditingBook(null);
                      setBookForm({ title: '', author: '', category: '', pdfUrl: '', status: 'queued' });
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </NotebookPage>
      )}

      {/* Reading List */}
      <div className="grid grid-cols-1 gap-6">
        {/* Books */}
        <div className="space-y-6 md:space-y-8">
          <h2 className="text-lg md:text-xl font-semibold text-foreground">Books</h2>
          
          {items.length === 0 ? (
            <NotebookPage showLines>
              <div className="text-center py-8 md:py-12">
                <BookOpen size={40} className="mx-auto text-muted-foreground mb-3 md:mb-4" />
                <h3 className="text-base md:text-lg font-medium text-foreground mb-2">No books in your list</h3>
                <p className="text-sm md:text-base text-muted-foreground">Add your first book to start tracking your reading journey.</p>
              </div>
            </NotebookPage>
          ) : (
            items.map((item) => (
              <NotebookPage key={item.id}>
                <Card className="border-0 bg-transparent shadow-none mobile-card">
                  <CardHeader className="pb-6 pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-foreground text-lg md:text-xl line-clamp-2 mb-2">{item.title}</CardTitle>
                        {item.author && (
                          <p className="text-muted-foreground text-base mt-2 line-clamp-1">by {item.author}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                        {item.category && (
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        )}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editBook(item)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit size={14} />
                          </Button>
                          {item.pdfUrl && (
                            <a 
                              href={item.pdfUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 p-1"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {item.progressPct > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{item.progressPct}%</span>
                        </div>
                        <Progress value={item.progressPct} className="h-2" />
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pt-2 pb-6">
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                      <Select value={item.status} onValueChange={(value: ReadingItem['status']) => updateBookStatus(item.id, value)}>
                        <SelectTrigger className="w-full sm:w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border z-50">
                          <SelectItem value="queued">Queued</SelectItem>
                          <SelectItem value="reading">Reading</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNoteForm(showNoteForm === item.id ? null : item.id)}
                        className="flex items-center gap-1 w-full sm:w-auto"
                      >
                        <Lightbulb size={14} />
                        Add Note
                      </Button>

                      {getItemNotes(item.id).length > 0 && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => generateFlashcardsWithAI(item.id)}
                          disabled={generatingFlashcards === item.id}
                          className="flex items-center gap-1 w-full sm:w-auto"
                        >
                          <Sparkles size={14} />
                          {generatingFlashcards === item.id ? 'Generating...' : 'AI Generate Flashcards'}
                        </Button>
                      )}
                    </div>

                    {/* Add Note Form */}
                    {showNoteForm === item.id && (
                      <div className="border-t border-notebook-lines pt-4">
                        <Textarea
                          value={noteForm.content}
                          onChange={(e) => setNoteForm({ content: e.target.value })}
                          placeholder="What did you learn? How will you apply it?"
                          rows={3}
                          className="mb-2"
                        />
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => addNote(item.id)}
                            disabled={!noteForm.content.trim()}
                            className="w-full sm:w-auto"
                          >
                            Save Note
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setShowNoteForm(null)}
                            className="w-full sm:w-auto"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Existing Notes */}
                    {getItemNotes(item.id).length > 0 && (
                      <div className="border-t border-notebook-lines pt-4 mt-4">
                        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                          <FileText size={14} />
                          Notes ({getItemNotes(item.id).length})
                        </h4>
                        <div className="space-y-3">
                          {getItemNotes(item.id).slice(0, 2).map((note) => (
                            <div key={note.id} className="text-sm p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(note.createdAt)} at {formatTime(note.createdAt)}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowFlashcardForm(showFlashcardForm === note.id ? null : note.id)}
                                  className="h-6 text-xs flex items-center gap-1"
                                >
                                  <Brain size={12} />
                                  Create Flashcard
                                </Button>
                              </div>
                              <p className="text-foreground whitespace-pre-wrap text-sm mb-2">{note.content}</p>
                              
                              {/* Flashcard Form */}
                              {showFlashcardForm === note.id && (
                                <div className="mt-3 space-y-2 pt-3 border-t border-border">
                                  <div>
                                    <label className="text-xs font-medium text-foreground">Question</label>
                                    <Input
                                      value={flashcardForm.question}
                                      onChange={(e) => setFlashcardForm(prev => ({ ...prev, question: e.target.value }))}
                                      placeholder="What question should this answer?"
                                      className="mt-1 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-foreground">Answer</label>
                                    <Textarea
                                      value={flashcardForm.answer}
                                      onChange={(e) => setFlashcardForm(prev => ({ ...prev, answer: e.target.value }))}
                                      placeholder="The answer or key insight..."
                                      rows={2}
                                      className="mt-1 text-sm"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      onClick={() => createFlashcard(note.id, item.id)}
                                      disabled={!flashcardForm.question.trim() || !flashcardForm.answer.trim()}
                                    >
                                      Create
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => setShowFlashcardForm(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          {getItemNotes(item.id).length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              +{getItemNotes(item.id).length - 2} more notes
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Flashcards */}
                    {getItemFlashcards(item.id).length > 0 && (
                      <div className="border-t border-notebook-lines pt-4 mt-4">
                        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                          <Brain size={14} />
                          Flashcards ({getItemFlashcards(item.id).length})
                        </h4>
                        <div className="space-y-2">
                          {getItemFlashcards(item.id).slice(0, 3).map((card) => (
                            <div key={card.id} className="text-sm p-3 bg-accent/10 rounded-lg">
                              <div className="font-medium text-foreground mb-1">Q: {card.question}</div>
                              <div className="text-muted-foreground text-xs mb-1">A: {card.answer}</div>
                              <div className="text-xs text-muted-foreground">
                                Reviewed {card.timesReviewed} time{card.timesReviewed !== 1 ? 's' : ''}
                                {card.lastReviewed && ` • Last: ${formatDate(card.lastReviewed)}`}
                              </div>
                            </div>
                          ))}
                          {getItemFlashcards(item.id).length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{getItemFlashcards(item.id).length - 3} more flashcards
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </NotebookPage>
            ))
          )}
        </div>

        {/* Recent Notes */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-ink">Recent Notes</h2>
          
          {notes.length === 0 ? (
            <NotebookPage showLines>
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-ink mb-2">No reading notes yet</h3>
                <p className="text-muted-foreground">Add notes to your books to capture insights and learnings.</p>
              </div>
            </NotebookPage>
          ) : (
            notes.slice(0, 10).map((note) => {
              const book = items.find(item => item.id === note.itemId);
              return (
                <NotebookPage key={note.id} showLines>
                  <Card className="border-0 bg-transparent shadow-none">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-sm text-ink">{book?.title || 'Unknown Book'}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(note.createdAt)} at {formatTime(note.createdAt)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-ink whitespace-pre-wrap">{note.content}</p>
                      
                      {/* Quick Flashcard Creator */}
                      <div className="mt-3 pt-3 border-t border-notebook-lines">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowFlashcardForm(showFlashcardForm === note.id ? null : note.id)}
                          className="flex items-center gap-1"
                        >
                          <Brain size={14} />
                          Create Flashcard from Note
                        </Button>
                        
                        {showFlashcardForm === note.id && (
                          <div className="mt-3 space-y-2">
                            <div>
                              <label className="text-xs font-medium text-foreground">Question</label>
                              <Input
                                value={flashcardForm.question}
                                onChange={(e) => setFlashcardForm(prev => ({ ...prev, question: e.target.value }))}
                                placeholder="What question should this answer?"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-foreground">Answer</label>
                              <Textarea
                                value={flashcardForm.answer}
                                onChange={(e) => setFlashcardForm(prev => ({ ...prev, answer: e.target.value }))}
                                placeholder="The answer or key insight..."
                                rows={2}
                                className="mt-1"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => createFlashcard(note.id, note.itemId)}
                                disabled={!flashcardForm.question.trim() || !flashcardForm.answer.trim()}
                              >
                                Create Flashcard
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setShowFlashcardForm(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </NotebookPage>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
