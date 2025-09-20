import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NotebookPage } from '@/components/NotebookPage';
import { storage, generateId, formatDate } from '@/lib/storage';
import { Transaction, Envelope } from '@/types';
import { DollarSign, Upload, TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Finance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [envelopeForm, setEnvelopeForm] = useState({
    name: '',
    goalAmount: '',
    balance: ''
  });

  useEffect(() => {
    const loadedTransactions = storage.transactions.getAll();
    const loadedEnvelopes = storage.envelopes.getAll();
    
    setTransactions(loadedTransactions.sort((a, b) => b.date.getTime() - a.date.getTime()));
    setEnvelopes(loadedEnvelopes);
  }, []);

  const calculateSnapshot = () => {
    const income = transactions
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const expenses = Math.abs(transactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + tx.amount, 0));
    
    const net = income - expenses;
    const savingsRate = income > 0 ? (net / income) * 100 : 0;

    return {
      income: Math.round(income * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      net: Math.round(net * 100) / 100,
      savingsRate: Math.round(savingsRate * 10) / 10
    };
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvContent = e.target?.result as string;
      const lines = csvContent.split('\n').filter(line => line.trim());
      const newTransactions: Transaction[] = [];

      // Skip header row and process data
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',').map(col => col.trim().replace(/"/g, ''));
        
        if (columns.length >= 2) {
          const [dateStr, amountStr, category = '', note = ''] = columns;
          
          try {
            const date = new Date(dateStr);
            const amount = parseFloat(amountStr);
            
            if (!isNaN(date.getTime()) && !isNaN(amount)) {
              const transaction: Transaction = {
                id: generateId(),
                date,
                amount,
                category: category || undefined,
                note: note || undefined
              };
              newTransactions.push(transaction);
            }
          } catch (error) {
            console.warn(`Skipping invalid row ${i + 1}:`, columns);
          }
        }
      }

      if (newTransactions.length > 0) {
        const updatedTransactions = [...newTransactions, ...transactions];
        setTransactions(updatedTransactions.sort((a, b) => b.date.getTime() - a.date.getTime()));
        storage.transactions.save(updatedTransactions);
        
        toast({
          title: "CSV Imported",
          description: `Successfully imported ${newTransactions.length} transactions.`
        });
      } else {
        toast({
          title: "Import Failed",
          description: "No valid transactions found in the CSV file.",
          variant: "destructive"
        });
      }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const addEnvelope = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!envelopeForm.name.trim() || !envelopeForm.goalAmount) return;

    const newEnvelope: Envelope = {
      id: generateId(),
      name: envelopeForm.name.trim(),
      goalAmount: parseFloat(envelopeForm.goalAmount),
      balance: envelopeForm.balance ? parseFloat(envelopeForm.balance) : 0
    };

    const updatedEnvelopes = [...envelopes, newEnvelope];
    setEnvelopes(updatedEnvelopes);
    storage.envelopes.save(updatedEnvelopes);

    setEnvelopeForm({ name: '', goalAmount: '', balance: '' });
    
    toast({
      title: "Envelope Created",
      description: `"${newEnvelope.name}" envelope created.`
    });
  };

  const snapshot = calculateSnapshot();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-ink" />
          <h1 className="text-3xl font-bold text-ink">Finance</h1>
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
            />
            <Button className="flex items-center gap-2">
              <Upload size={16} />
              Import CSV
            </Button>
          </label>
        </div>
      </div>

      {/* Financial Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <NotebookPage>
          <Card className="border-0 bg-transparent shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-success" />
                <div>
                  <p className="text-2xl font-bold text-ink">${snapshot.income}</p>
                  <p className="text-xs text-muted-foreground">Income</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </NotebookPage>

        <NotebookPage>
          <Card className="border-0 bg-transparent shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-2xl font-bold text-ink">${snapshot.expenses}</p>
                  <p className="text-xs text-muted-foreground">Expenses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </NotebookPage>

        <NotebookPage>
          <Card className="border-0 bg-transparent shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Wallet className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-ink">${snapshot.net}</p>
                  <p className="text-xs text-muted-foreground">Net</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </NotebookPage>

        <NotebookPage>
          <Card className="border-0 bg-transparent shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Target className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-2xl font-bold text-ink">{snapshot.savingsRate}%</p>
                  <p className="text-xs text-muted-foreground">Savings Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </NotebookPage>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Envelopes */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-ink">Budget Envelopes</h2>
          
          {/* Add Envelope Form */}
          <NotebookPage showLines>
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader>
                <CardTitle className="text-ink">Add Envelope</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addEnvelope} className="space-y-3">
                  <Input
                    value={envelopeForm.name}
                    onChange={(e) => setEnvelopeForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Envelope name (e.g., Groceries)"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={envelopeForm.goalAmount}
                      onChange={(e) => setEnvelopeForm(prev => ({ ...prev, goalAmount: e.target.value }))}
                      placeholder="Goal amount"
                      required
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={envelopeForm.balance}
                      onChange={(e) => setEnvelopeForm(prev => ({ ...prev, balance: e.target.value }))}
                      placeholder="Current balance"
                    />
                  </div>
                  <Button type="submit" size="sm">Add Envelope</Button>
                </form>
              </CardContent>
            </Card>
          </NotebookPage>

          {/* Envelope List */}
          {envelopes.map((envelope) => {
            const progressPct = envelope.goalAmount > 0 ? (envelope.balance / envelope.goalAmount) * 100 : 0;
            
            return (
              <NotebookPage key={envelope.id}>
                <Card className="border-0 bg-transparent shadow-none">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-ink">{envelope.name}</CardTitle>
                      <div className="text-right">
                        <div className="text-lg font-bold text-ink">
                          ${envelope.balance} / ${envelope.goalAmount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {Math.round(progressPct)}%
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progressPct >= 100 ? 'bg-success' : progressPct >= 75 ? 'bg-accent' : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(progressPct, 100)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </NotebookPage>
            );
          })}

          {envelopes.length === 0 && (
            <NotebookPage showLines>
              <div className="text-center py-8">
                <Wallet size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-ink mb-2">No envelopes yet</h3>
                <p className="text-muted-foreground">Create budget envelopes to track your spending goals.</p>
              </div>
            </NotebookPage>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-ink">Recent Transactions</h2>
          
          {transactions.length === 0 ? (
            <NotebookPage showLines>
              <div className="text-center py-12">
                <DollarSign size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-ink mb-2">No transactions yet</h3>
                <p className="text-muted-foreground mb-4">Import a CSV file to get started.</p>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">CSV Format:</p>
                  <p>date,amount,category,note</p>
                  <p>2025-01-01,-25.50,Groceries,Weekly shopping</p>
                  <p>2025-01-02,3000.00,Salary,Monthly salary</p>
                </div>
              </div>
            </NotebookPage>
          ) : (
            transactions.slice(0, 20).map((transaction) => (
              <NotebookPage key={transaction.id}>
                <Card className="border-0 bg-transparent shadow-none">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          transaction.amount > 0 
                            ? 'bg-success/10 text-success' 
                            : 'bg-destructive/10 text-destructive'
                        }`}>
                          {transaction.amount > 0 ? 
                            <TrendingUp size={16} /> : 
                            <TrendingDown size={16} />
                          }
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-ink">
                              {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount)}
                            </span>
                            {transaction.category && (
                              <span className="text-sm bg-muted px-2 py-1 rounded text-muted-foreground">
                                {transaction.category}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(transaction.date)}
                            {transaction.note && ` • ${transaction.note}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </NotebookPage>
            ))
          )}
        </div>
      </div>
    </div>
  );
}