import { useState, useEffect } from 'react';
import { Contact, supabase } from '@/lib/supabase';
import { generateDemoContactsWithTimestamps } from '@/data/demoContacts';

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);

      // For demo purposes, use local demo data
      // In production, this would fetch from Supabase
      const demoData = generateDemoContactsWithTimestamps();
      const contactsWithIds = demoData.map((contact, index) => ({
        ...contact,
        id: `demo-${index}`,
        user_id: 'demo-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      setContacts(contactsWithIds);

      // TODO: Replace with actual Supabase query when backend is set up
      // const { data, error } = await supabase
      //   .from('contacts')
      //   .select('*')
      //   .order('importance_score', { ascending: false });
      // if (error) throw error;
      // setContacts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  const getDueContacts = () => {
    const now = new Date();
    return contacts.filter(contact => {
      if (!contact.next_due_at) return false;
      return new Date(contact.next_due_at) <= now;
    }).slice(0, 8); // Daily capacity default
  };

  const markContactSent = async (contactId: string, message: string) => {
    try {
      const now = new Date();
      const contact = contacts.find(c => c.id === contactId);
      if (!contact) return;

      const nextDueAt = new Date();
      nextDueAt.setDate(nextDueAt.getDate() + contact.frequency_days);

      // For demo: Update local state
      setContacts(prevContacts =>
        prevContacts.map(c =>
          c.id === contactId
            ? {
                ...c,
                last_contacted_at: now.toISOString(),
                next_due_at: nextDueAt.toISOString(),
                updated_at: now.toISOString()
              }
            : c
        )
      );

      // TODO: In production, update Supabase
    } catch (err) {
      console.error('Failed to mark contact as sent:', err);
      throw err;
    }
  };

  const snoozeContact = async (contactId: string) => {
    try {
      const contact = contacts.find(c => c.id === contactId);
      if (!contact) return;

      const snoozeDays = contact.segment === 'TOP5' ? 2 : 7;
      const nextDueAt = new Date();
      nextDueAt.setDate(nextDueAt.getDate() + snoozeDays);
      const now = new Date();

      setContacts(prevContacts =>
        prevContacts.map(c =>
          c.id === contactId
            ? {
                ...c,
                next_due_at: nextDueAt.toISOString(),
                updated_at: now.toISOString()
              }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to snooze contact:', err);
      throw err;
    }
  };

  const skipContact = async (contactId: string) => {
    try {
      const contact = contacts.find(c => c.id === contactId);
      if (!contact) return;

      const nextDueAt = new Date();
      nextDueAt.setDate(nextDueAt.getDate() + contact.frequency_days);
      const now = new Date();

      setContacts(prevContacts =>
        prevContacts.map(c =>
          c.id === contactId
            ? {
                ...c,
                next_due_at: nextDueAt.toISOString(),
                updated_at: now.toISOString()
              }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to skip contact:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const addContact = async (contactData: Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_contacted_at' | 'next_due_at'>) => {
    try {
      const now = new Date();
      const nextDueAt = new Date();
      nextDueAt.setDate(nextDueAt.getDate() + contactData.frequency_days);

      const newContact: Contact = {
        ...contactData,
        id: `manual-${Date.now()}`,
        user_id: 'demo-user',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        last_contacted_at: undefined,
        next_due_at: nextDueAt.toISOString(),
      };

      setContacts(prevContacts => [...prevContacts, newContact]);
    } catch (err) {
      console.error('Failed to add contact:', err);
      throw err;
    }
  };

  return {
    contacts,
    loading,
    error,
    dueContacts: getDueContacts(),
    markContactSent,
    snoozeContact,
    skipContact,
    addContact,
    refreshContacts: fetchContacts
  };
}