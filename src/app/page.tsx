'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import type { Quote } from '@/types';

const QuoteForm = dynamic(() => import('@/components/QuoteForm'), {
  ssr: false,
});
const QuoteWall = dynamic(() => import('@/components/QuoteWall'), {
  ssr: false,
});

function isRTL(text: string) {
  const rtlRegex = /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlRegex.test(text);
}

function FloatingQuote({ quote, index, total }: { quote: Quote; index: number; total: number }) {
  const randomDelay = index * -4;
  const duration = 20 + Math.random() * 10;

  // Calculate horizontal position based on index and total quotes
  const section = 100 / total; // Divide screen into sections
  const baseX = section * index; // Base position for this quote
  const variance = section * 0.3; // Allow 30% variance within section
  const xPos = baseX + (Math.random() * variance - variance/2); // Add random variance

  // Fixed width quotes for better control
  const sizeClasses = {
    sm: 'w-[260px] md:w-[300px]',
    md: 'w-[280px] md:w-[350px]',
    lg: 'w-[300px] md:w-[400px]'
  };

  // Adjust size thresholds for better quote distribution
  const size = quote.quote.length > 200 ? 'lg' : quote.quote.length > 100 ? 'md' : 'sm';

  return (
    <motion.div
      initial={{ 
        opacity: 0,
        x: `${xPos}vw`,
        y: '120vh',
        scale: 1
      }}
      animate={{ 
        opacity: [0, 1, 1, 0],
        x: `${xPos}vw`,
        y: ['120vh', '-20vh'],
        scale: 1
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay: randomDelay,
        ease: "linear",
        times: [0, 0.1, 0.9, 1]
      }}
      className="fixed pointer-events-none select-none"
      style={{
        filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
        willChange: 'transform',
        transform: 'translateX(-50%)'
      }}
    >
      <div 
        className={`bg-white/20 backdrop-blur-md rounded-xl md:rounded-3xl p-3 md:p-6 border border-white/30 ${sizeClasses[size]}`}
      >
        <div className="max-h-[35vh] overflow-y-auto custom-scrollbar">
          <p 
            className="font-medium break-words text-white text-sm md:text-base leading-relaxed"
            dir={isRTL(quote.quote) ? 'rtl' : 'ltr'}
            style={{ 
              textAlign: isRTL(quote.quote) ? 'right' : 'left',
              direction: isRTL(quote.quote) ? 'rtl' : 'ltr'
            }}
          >
            {quote.quote}
          </p>
          <p 
            className="text-white/80 text-xs md:text-sm mt-2 md:mt-3 italic"
            dir={isRTL(quote.full_name) ? 'rtl' : 'ltr'}
            style={{ 
              textAlign: isRTL(quote.full_name) ? 'right' : 'left',
              direction: isRTL(quote.full_name) ? 'rtl' : 'ltr'
            }}
          >
            — {quote.full_name}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [showQuotes, setShowQuotes] = useState(false);
  const [quotesCount, setQuotesCount] = useState(0);
  const [backgroundQuotes, setBackgroundQuotes] = useState<Quote[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Effect to fetch initial quote count
  useEffect(() => {
    const fetchQuoteCount = async () => {
      const { count } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true });
      
      if (count !== null) {
        setQuotesCount(count);
      }
    };

    fetchQuoteCount();

    // Subscribe to quote changes
    const subscription = supabase
      .channel('quotes_count')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quotes',
        },
        () => {
          setQuotesCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchBackgroundQuotes = async () => {
      const { data } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(isMobile ? 4 : 6);
      
      if (data) {
        setBackgroundQuotes(data);
      }
    };

    fetchBackgroundQuotes();

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
          setBackgroundQuotes((current) => {
            const newQuotes = [payload.new as Quote, ...current];
            return newQuotes.slice(0, isMobile ? 4 : 6);
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [isMobile]);

  return (
    <main className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
      {/* Background floating quotes */}
      <div className="fixed inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_center,_rgba(0,0,255,0.15)_0%,_rgba(0,0,0,0.2)_100%)]">
        <style jsx global>{`
          html, body {
            position: fixed;
            overflow: hidden;
            width: 100%;
            height: 100%;
            overscroll-behavior: none;
            -webkit-overflow-scrolling: none;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 10px;
          }
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1);
            -webkit-overflow-scrolling: touch;
            padding-right: 3px;
          }
        `}</style>
        {backgroundQuotes.map((quote, index) => (
          <FloatingQuote 
            key={quote.id} 
            quote={quote} 
            index={index}
            total={backgroundQuotes.length}
          />
        ))}
      </div>

      <div className="w-full h-full flex items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-6xl mx-auto relative">
          <AnimatePresence initial={false} mode="wait">
            {!showQuotes ? (
              <motion.div
                key="form"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 1 }}
                className="w-full max-w-[340px] md:max-w-md mx-auto"
              >
                <div className="glass-panel rounded-xl md:rounded-2xl p-6 md:p-8">
                  <QuoteForm 
                    onQuoteAdded={() => setQuotesCount((prev) => prev + 1)}
                    onSuccessfulSubmit={() => setShowQuotes(true)}
                  />
                  <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 md:mt-8 text-center"
                  >
                    <motion.button
                      onClick={() => setShowQuotes(true)}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 bg-white hover:bg-gray-50 rounded-full text-primary text-sm md:text-base font-medium transition-all duration-200 shadow-sm hover:shadow-md border border-gray-100"
                    >
                      View All Quotes
                      {quotesCount > 0 && (
                        <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                          {quotesCount}
                        </span>
                      )}
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="wall"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 1 }}
                className="relative w-full"
              >
                <QuoteWall onQuotesLoaded={setQuotesCount} />
                <motion.button
                  onClick={() => setShowQuotes(false)}
                  whileTap={{ scale: 0.98 }}
                  className="absolute top-7 left-4 px-3 md:px-4 py-2 bg-white hover:bg-gray-50 rounded-full text-primary text-xs md:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 md:gap-2 shadow-sm hover:shadow-md border border-gray-100"
                >
                  ← Back to Form
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="absolute bottom-1 left-0 right-0 text-center">
          <p className="text-white/60 text-sm">
            Created by 
            <span className="font-medium text-white hover:text-white/90 transition-colors"> RM</span> 
          </p>
        </div>
      </div>
    </main>
  );
}
