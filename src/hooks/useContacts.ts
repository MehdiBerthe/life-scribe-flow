import { useState, useEffect } from 'react';
import { Contact } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadContacts = async () => {
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading contacts:', error);
        return;
      }

      const contactsWithDates = data.map(contact => ({
        ...contact,
        last_touch: contact.last_touch ? new Date(contact.last_touch) : undefined,
        next_touch: contact.next_touch ? new Date(contact.next_touch) : undefined,
        created_at: new Date(contact.created_at),
        updated_at: new Date(contact.updated_at),
      }));

      setContacts(contactsWithDates);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [user]);

  const addContact = async (contactData: Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert([{
          ...contactData,
          user_id: user.id,
          last_touch: contactData.last_touch?.toISOString().split('T')[0],
          next_touch: contactData.next_touch?.toISOString().split('T')[0],
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding contact:', error);
        return { error };
      }

      const newContact = {
        ...data,
        last_touch: data.last_touch ? new Date(data.last_touch) : undefined,
        next_touch: data.next_touch ? new Date(data.next_touch) : undefined,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      };

      setContacts(prev => [newContact, ...prev]);
      return { data: newContact };
    } catch (error) {
      console.error('Error adding contact:', error);
      return { error };
    }
  };

  const updateContact = async (id: string, updates: Partial<Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const updateData: any = { ...updates };
      
      // Convert Date objects to ISO strings for database storage
      if (updateData.last_touch instanceof Date) {
        updateData.last_touch = updateData.last_touch.toISOString().split('T')[0];
      }
      if (updateData.next_touch instanceof Date) {
        updateData.next_touch = updateData.next_touch.toISOString().split('T')[0];
      }

      const { data, error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating contact:', error);
        return { error };
      }

      const updatedContact = {
        ...data,
        last_touch: data.last_touch ? new Date(data.last_touch) : undefined,
        next_touch: data.next_touch ? new Date(data.next_touch) : undefined,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      };

      setContacts(prev => prev.map(c => c.id === id ? updatedContact : c));
      return { data: updatedContact };
    } catch (error) {
      console.error('Error updating contact:', error);
      return { error };
    }
  };

  const deleteContact = async (id: string) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting contact:', error);
        return { error };
      }

      setContacts(prev => prev.filter(c => c.id !== id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting contact:', error);
      return { error };
    }
  };

  const markSent = async (id: string) => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return updateContact(id, {
      last_touch: today,
      next_touch: nextWeek,
    });
  };

  const snoozeContact = async (id: string, days: number = 7) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return updateContact(id, {
      next_touch: futureDate,
    });
  };

  const skipContact = async (id: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return updateContact(id, {
      next_touch: tomorrow,
    });
  };

  const getDueContacts = () => {
    const now = new Date();
    return contacts.filter(contact => {
      if (!contact.next_touch) return false;
      return contact.next_touch <= now;
    }).slice(0, 8);
  };

  return {
    contacts,
    loading,
    dueContacts: getDueContacts(),
    addContact,
    updateContact,
    deleteContact,
    markSent,
    snoozeContact,
    skipContact,
    refetch: loadContacts,
  };
}