
"use client";
/**
 * @fileOverview This file defines a custom hook, `useQuizHistory`, for managing
 * the user's quiz history. It handles fetching, displaying, and saving quiz results.
 */

import { useState, useEffect, useCallback } from 'react';
import type { QuizHistoryItem } from '@/types/quiz.types';
import { useAuth } from './use-auth';
import { getQuizHistoryAction, saveQuizHistoryAction } from '@/app/actions';
import { useToast } from './use-toast';

/**
 * @function useQuizHistory
 * @description A custom hook that provides an interface to the user's quiz history.
 *
 * @returns {{
 *   history: QuizHistoryItem[],
 *   loading: boolean,
 *   addQuizToHistory: (quizItem: Omit<QuizHistoryItem, 'id' | 'date'> & { date: Date }) => Promise<void>,
 *   clearHistory: () => void
 * }}
 */
export const useQuizHistory = () => {
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  /**
   * Loads the quiz history for a given user by calling a server action.
   * @param {string} email - The user's email.
   */
  const loadHistory = useCallback(async (email: string) => {
    if (!email) return;
    setLoading(true);
    const result = await getQuizHistoryAction(email);
    if (result.success && result.data) {
        // Mongoose returns `_id`, we map it to `id` for consistency on the client.
        const fetchedHistory = result.data.map((item: any) => ({
            ...item,
            id: item._id, 
        }));
        setHistory(fetchedHistory);
    } else {
        toast({
            variant: "destructive",
            title: "Could not load history",
            description: result.error,
        });
        setHistory([]);
    }
    setLoading(false);
  }, [toast]);

  // Effect to load history when the user logs in or auth state changes.
  useEffect(() => {
    if (!authLoading && user) {
        loadHistory(user.email);
    } else if (!authLoading && !user) {
        // Clear history if user logs out.
        setHistory([]);
        setLoading(false);
    }
  }, [user, authLoading, loadHistory]);

  /**
   * Adds a completed quiz to the history. It first performs an optimistic update
   * on the client, then calls the server action to save the data to the database.
   * @param {Omit<QuizHistoryItem, 'id' | 'date'> & { date: Date }} quizItem - The quiz data to save.
   */
  const addQuizToHistory = async (quizItem: Omit<QuizHistoryItem, 'id' | 'date'> & { date: Date }) => {
    if (!user) return;
    
    // Optimistically update the UI for a faster user experience.
    const optimisticItem: QuizHistoryItem = {
        ...quizItem,
        id: new Date().toISOString(), // Use a temporary ID for the key.
    };
    setHistory(prevHistory => [optimisticItem, ...prevHistory]);

    // Then, save to the database.
    const result = await saveQuizHistoryAction(optimisticItem, user.email);

    if (!result.success) {
        toast({
            variant: "destructive",
            title: "Sync Error",
            description: "Could not save this quiz to your account."
        });
        // Revert the optimistic update on failure.
        setHistory(prev => prev.filter(item => item.id !== optimisticItem.id));
        return { historyId: null };
    } else {
       // On success, refresh history from the DB to get the real ID and ensure consistency.
       await loadHistory(user.email);
       return { historyId: result.historyId };
    }
  };

  /**
   * Clears the local quiz history.
   * Note: This does not currently clear the history from the database.
   */
  const clearHistory = () => {
    // In a real app, this would call a `clearQuizHistoryAction` on the server.
    setHistory([]);
  };

  return { history, loading, addQuizToHistory, clearHistory };
};
