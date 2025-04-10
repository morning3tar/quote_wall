'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  // Slower timing with better spacing
  const baseDelay = index * 2; // More delay between quotes
  const duration = 40; // Much slower movement

  // Better horizontal spacing
  const columns = Math.min(Math.ceil(total / 4), 6); // Max 6 columns
  const column = index % columns;
  const xPos = (100 / (columns + 1)) * (column + 1); // Even spacing with margins

  // Vertical spacing
  const row = Math.floor(index / columns);
  const yStart = 120 + (row * 20); // Stagger start positions
  
  const sizeClasses = {
    sm: 'w-[220px] md:w-[280px]',
    md: 'w-[260px] md:w-[320px]',
    lg: 'w-[300px] md:w-[380px]'
  };

  const size = quote.quote.length > 200 ? 'lg' : quote.quote.length > 100 ? 'md' : 'sm';
  
  return (
    <motion.div
      initial={{ 
        opacity: 0,
        x: `${xPos}vw`,
        y: `${yStart}vh`,
      }}
      animate={{ 
        opacity: [0, 1, 1, 0],
        x: `${xPos}vw`,
        y: [`${yStart}vh`, '-20vh'],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay: baseDelay,
        ease: [0.4, 0, 0.2, 1],
        times: [0, 0.1, 0.9, 1]
      }}
      className="fixed pointer-events-none select-none"
      style={{
        filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
        willChange: 'transform, opacity',
        transform: 'translateX(-50%)',
        left: 0,
        top: 0,
        zIndex: Math.floor(index / columns) // Layer quotes by row
      }}
    >
      <div 
        className={`bg-white/20 backdrop-blur-md rounded-xl md:rounded-3xl p-3 md:p-6 border border-white/30 ${sizeClasses[size]}`}
      >
        <div className="max-h-[45vh] md:max-h-[50vh] overflow-y-auto custom-scrollbar">
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
  const [currentPage, setCurrentPage] = useState(0);
  const [rotationTimer, setRotationTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Effect to fetch initial quote count and set up real-time listener
  useEffect(() => {
    const q = query(
      collection(db, 'quotes'),
      orderBy('created_at', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const quotes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at
      })) as Quote[];
      
      setBackgroundQuotes(quotes);
      setQuotesCount(quotes.length);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching quotes:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
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

  // Effect to rotate through quotes periodically
  useEffect(() => {
    const displayQuotesPerPage = isMobile ? 12 : 24;
    
    const q = query(
      collection(db, 'quotes'),
      orderBy('created_at', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const quotes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at
      })) as Quote[];
      
      setBackgroundQuotes(quotes);
      
      // Clear existing timer
      if (rotationTimer) {
        clearTimeout(rotationTimer);
      }
      
      // Set new timer for rotation
      const totalPages = Math.ceil(quotes.length / displayQuotesPerPage);
      const timer = setTimeout(() => {
        setCurrentPage(current => (current + 1) % totalPages);
      }, 30000); // Rotate every 30 seconds
      
      setRotationTimer(timer);
    });

    return () => {
      if (rotationTimer) {
        clearTimeout(rotationTimer);
      }
      unsubscribe();
    };
  }, [isMobile, currentPage, rotationTimer]);

  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setCurrentPage((prevIndex) => (prevIndex + 1) % backgroundQuotes.length);
    }, 5000);

    setRotationTimer(rotationInterval);

    return () => {
      if (rotationInterval) {
        clearInterval(rotationInterval);
      }
    };
  }, [backgroundQuotes.length]);

  return (
    <main className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-pink-950 via-rose-900 to-purple-900">
      {/* Background floating quotes */}
      <div className="fixed inset-0 overflow-hidden">
        {/* Add a subtle pattern overlay */}
        <div className="absolute inset-0" 
          style={{
            backgroundImage: `
              radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, rgba(219,172,222,0.1) 100%),
              repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 8px)
            `,
            backgroundSize: '100% 100%, 16px 16px'
          }}
        />
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
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        ) : (
          backgroundQuotes.map((quote, index) => (
            <FloatingQuote 
              key={quote.id} 
              quote={quote} 
              index={index}
              total={backgroundQuotes.length}
            />
          ))
        )}
      </div>

      <div className="w-full h-full flex items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-6xl mx-auto relative -mt-5 md:-mt-16">
          <AnimatePresence initial={false} mode="wait">
            {!showQuotes ? (
              <motion.div
                key="form"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 1 }}
                className="w-full max-w-[340px] md:max-w-md mx-auto"
              >
                <div 
                  className="glass-panel rounded-xl md:rounded-2xl p-6 md:p-8 relative overflow-hidden"
                  style={{
                    backgroundImage: `
                      linear-gradient(
                        rgba(255, 255, 255, 0.82), 
                        rgba(255, 255, 255, 0.82)
                      ),
                      url('/nowruz-bg.jpg')
                    `,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.4)'
                  }}
                >
                  <div className="relative z-10">
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
                        View Quotes Wall
                        {quotesCount > 0 && (
                          <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                            {quotesCount}
                          </span>
                        )}
                      </motion.button>
                    </motion.div>
                  </div>
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
        <div className="absolute bottom-2 left-0 right-0 text-center">
          <p className="text-white/60 text-sm">
            Created by 
            <span className="font-medium text-white hover:text-white/90 transition-colors"> RM</span> 
          </p>
        </div>
      </div>
    </main>
  );
}
