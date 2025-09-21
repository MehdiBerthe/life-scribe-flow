import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { storage } from '@/lib/storage';

export const useVectorization = () => {
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, type: '' });
  const { toast } = useToast();

  const vectorizeAllData = async () => {
    setIsVectorizing(true);
    setProgress({ current: 0, total: 0, type: 'Starting...' });
    
    try {
      // First, vectorize contacts from database
      const { data: contactResult, error: contactError } = await supabase.functions.invoke('vectorize-data', {
        body: { action: 'vectorize_contacts' }
      });

      if (contactError) throw contactError;

      // Get all local storage data
      const journalData = storage.journal.getAll();
      const readingData = storage.reading.getAll();
      const goalData = storage.goals.getAll();
      const transactionData = storage.transactions.getAll();
      const physicalData = storage.physical.getAll();

      const dataTypes = [
        { name: 'journal', data: journalData },
        { name: 'reading', data: readingData },
        { name: 'goal', data: goalData },
        { name: 'transaction', data: transactionData },
        { name: 'physical', data: physicalData }
      ];

      let totalProcessed = contactResult?.processed || 0;
      let totalItems = contactResult?.total || 0;

      // Calculate total items
      dataTypes.forEach(type => {
        totalItems += type.data.length;
      });

      // Vectorize each data type
      for (const dataType of dataTypes) {
        if (dataType.data.length === 0) continue;
        
        setProgress({ 
          current: totalProcessed, 
          total: totalItems, 
          type: `Vectorizing ${dataType.name}...` 
        });

        const { data: result, error } = await supabase.functions.invoke('vectorize-data', {
          body: {
            action: 'vectorize_data',
            data: dataType.data,
            dataType: dataType.name
          }
        });

        if (error) {
          console.error(`Error vectorizing ${dataType.name}:`, error);
          continue;
        }

        totalProcessed += result?.processed || 0;
        setProgress({ 
          current: totalProcessed, 
          total: totalItems, 
          type: `Completed ${dataType.name}` 
        });
      }

      toast({
        title: "Vectorization Complete",
        description: `Successfully processed ${totalProcessed} items across all your data.`,
      });

      setProgress({ current: totalItems, total: totalItems, type: 'Complete!' });

    } catch (error) {
      console.error('Vectorization error:', error);
      toast({
        title: "Vectorization Failed",
        description: "There was an error processing your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVectorizing(false);
    }
  };

  const vectorizeContacts = async () => {
    setIsVectorizing(true);
    setProgress({ current: 0, total: 1, type: 'Vectorizing contacts...' });

    try {
      const { data, error } = await supabase.functions.invoke('vectorize-data', {
        body: { action: 'vectorize_contacts' }
      });

      if (error) throw error;

      toast({
        title: "Contact Vectorization Complete",
        description: `Processed ${data.processed} out of ${data.total} contacts.`,
      });

      setProgress({ current: 1, total: 1, type: 'Complete!' });

    } catch (error) {
      console.error('Contact vectorization error:', error);
      toast({
        title: "Vectorization Failed",
        description: "Failed to vectorize contacts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVectorizing(false);
    }
  };

  return {
    vectorizeAllData,
    vectorizeContacts,
    isVectorizing,
    progress
  };
};