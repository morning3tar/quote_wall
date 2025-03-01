import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import type { Quote } from '@/types';

interface QuoteWallProps {
  onQuotesLoaded?: (count: number) => void;
}

function formatDateTime(dateString: string) {
  try {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Format time
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${time}`;
    }

    // Check if it's yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${time}`;
    }

    // For other dates
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });

    return `${formattedDate} at ${time}`;
  } catch {
    return '';
  }
}

function isRTL(text: string) {
  const rtlRegex = /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlRegex.test(text);
}

export default function QuoteWall({ onQuotesLoaded }: QuoteWallProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch initial quotes
    const fetchQuotes = async () => {
      try {
        const { data, error: supabaseError } = await supabase
          .from('quotes')
          .select('*')
          .order('created_at', { ascending: false });

        if (supabaseError) throw supabaseError;

        setQuotes(data || []);
        onQuotesLoaded?.(data?.length || 0);
      } catch (err: Error | unknown) {
        console.error('Error fetching quotes:', err);
        setError(err instanceof Error ? err.message : 'Failed to load quotes. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuotes();

    // Subscribe to new quotes
    const subscription = supabase
      .channel('quotes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quotes',
        },
        (payload) => {
          setQuotes((current) => {
            const newQuotes = [payload.new as Quote, ...current];
            return newQuotes;
          });
          // Call onQuotesLoaded after state update
          setTimeout(() => {
            onQuotesLoaded?.(quotes.length + 1);
          }, 0);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [onQuotesLoaded, quotes.length]);

  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-8">
        <div className="h-96 flex items-center justify-center">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-2xl p-8">
        <div className="p-4 bg-red-50 text-error rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 1, scale: 1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 1, scale: 1 }}
      className="glass-panel rounded-2xl overflow-hidden w-full"
    >
      <div className="quote-wall-header p-4 md:p-6 flex flex-col items-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Quotes Wall</h2>
        <span className="quote-count">
          {quotes.length} {quotes.length === 1 ? 'Message' : 'Quote'}
        </span>
      </div>
      <div className="p-4 md:p-6 max-h-[600px] overflow-y-auto custom-scrollbar bg-white/95">
        <AnimatePresence initial={false}>
          {quotes.map((quote) => (
            <motion.div
              key={quote.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <div className="message-bubble">
                <div 
                  className="quote-header"
                  data-rtl={isRTL(quote.full_name)}
                >
                  <span 
                    className="quote-name"
                    dir={isRTL(quote.full_name) ? 'rtl' : 'ltr'}
                    style={{ 
                      direction: isRTL(quote.full_name) ? 'rtl' : 'ltr'
                    }}
                  >
                    {quote.full_name}
                  </span>
                  <span 
                    className="quote-time"
                    dir={isRTL(quote.full_name) ? 'rtl' : 'ltr'}
                  >
                    {formatDateTime(quote.created_at)}
                  </span>
                </div>
                <p 
                  className="quote-text"
                  dir={isRTL(quote.quote) ? 'rtl' : 'ltr'}
                  style={{ 
                    direction: isRTL(quote.quote) ? 'rtl' : 'ltr'
                  }}
                >
                  {quote.quote}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {quotes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <p className="text-lg mb-2">No quotes yet</p>
            <p className="text-sm">Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    </motion.div>
  );
} 