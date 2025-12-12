'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Quote } from '@/types';

// Background image configuration
// Set to a path string (e.g., '/nowruz-bg.jpg') to use an image, or null for default gradient
const BACKGROUND_IMAGE: string | null = '/Afra_Art_Gallery-Yalda5.png';
// Available options:
// - null (default gradient)
// - '/nowruz-bg.jpg'
// - '/Afra_Art_Gallery-Yalda5.png'
// - Any other image path in the public folder

// Background overlay darkness (0 = transparent, 1 = fully black)
// Adjust this to make floating quotes more visible (higher = darker overlay)
const BACKGROUND_OVERLAY_OPACITY = 0.31;

// Floating quote bubble color configuration
// Format: rgba(red, green, blue, opacity)
// Examples:
// - Dark: 'rgba(0, 0, 0, 0.75)' (black, 75% opacity)
// - Purple: 'rgba(88, 28, 135, 0.8)' (purple, 80% opacity)
// - Blue: 'rgba(30, 58, 138, 0.8)' (blue, 80% opacity)
// - Dark blue: 'rgba(15, 23, 42, 0.85)' (dark blue, 85% opacity)
// - Brown: 'rgba(68, 47, 28, 0.8)' (brown, 80% opacity)
const FLOATING_QUOTE_BG_COLOR = 'rgba(77, 57, 57, 0.58)';

// Presentation mode background configuration
// Set to a path string (e.g., '/nowruz-bg.jpg') to use an image, or null for default gradient
const PRESENTATION_BACKGROUND: string | null = '/Afra_Art_Gallery-Yalda5.png';
// Available options:
// - null (default dark gradient)
// - '/nowruz-bg.jpg'
// - '/Afra_Art_Gallery-Yalda5.png'
// - Any other image path in the public folder
// - CSS gradient string (e.g., 'linear-gradient(to bottom right, #1a1a2e, #16213e, #0f3460)')

// Presentation mode overlay darkness (0 = transparent, 1 = fully black)
// Adjust this to make quotes more visible over the background (higher = darker overlay)
const PRESENTATION_OVERLAY_OPACITY = 0.35;

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
        filter: 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.5))',
        willChange: 'transform, opacity',
        transform: 'translateX(-50%)',
        left: 0,
        top: 0,
        zIndex: Math.floor(index / columns) // Layer quotes by row
      }}
    >
      <div 
        className={`rounded-xl md:rounded-3xl p-3 md:p-6 border-2 ${sizeClasses[size]}`}
        style={{
          background: FLOATING_QUOTE_BG_COLOR,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="max-h-[45vh] md:max-h-[50vh] overflow-y-auto custom-scrollbar">
          <p 
            className="font-medium break-words text-white text-sm md:text-base leading-relaxed"
            dir={isRTL(quote.quote) ? 'rtl' : 'ltr'}
            style={{ 
              textAlign: isRTL(quote.quote) ? 'right' : 'left',
              direction: isRTL(quote.quote) ? 'rtl' : 'ltr',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 1px 2px rgba(0, 0, 0, 0.9)',
            }}
          >
            {quote.quote}
          </p>
          <p 
            className="text-white/90 text-xs md:text-sm mt-2 md:mt-3 italic font-medium"
            dir={isRTL(quote.full_name) ? 'rtl' : 'ltr'}
            style={{ 
              textAlign: isRTL(quote.full_name) ? 'right' : 'left',
              direction: isRTL(quote.full_name) ? 'rtl' : 'ltr',
              textShadow: '0 2px 6px rgba(0, 0, 0, 0.8), 0 1px 2px rgba(0, 0, 0, 0.9)',
            }}
          >
            <span className="inline-flex items-center gap-1.5 md:gap-2">
              <svg className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.9 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {quote.full_name}
            </span>
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
  const [presentationMode, setPresentationMode] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

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
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Exit presentation mode if resized to mobile
      if (mobile && presentationMode) {
        setPresentationMode(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [presentationMode]);

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

  // Keyboard navigation for presentation mode
  useEffect(() => {
    if (!presentationMode || backgroundQuotes.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentQuoteIndex((prev) => 
          prev > 0 ? prev - 1 : backgroundQuotes.length - 1
        );
      } else if (e.key === 'ArrowRight') {
        setCurrentQuoteIndex((prev) => 
          prev < backgroundQuotes.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'Escape') {
        setPresentationMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presentationMode, backgroundQuotes.length]);

  return (
    <main 
      className="fixed inset-0 flex items-center justify-center"
      style={{
        backgroundImage: BACKGROUND_IMAGE 
          ? `url(${BACKGROUND_IMAGE})`
          : 'linear-gradient(to bottom right, rgb(88, 28, 135), rgb(190, 24, 93), rgb(126, 34, 206))',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay to make background less visible */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundColor: BACKGROUND_IMAGE 
            ? `rgba(0, 0, 0, ${BACKGROUND_OVERLAY_OPACITY})` 
            : 'rgba(0, 0, 0, 0.2)',
        }}
      />

      {/* Background floating quotes */}
      <div className="fixed inset-0 overflow-hidden z-10">
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
                      url('/Afra_Art_Gallery-Yalda5.png')
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
                  className="absolute top-7 left-4 px-3 md:px-4 py-2 bg-white hover:bg-gray-50 rounded-full text-primary text-xs md:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 md:gap-2 shadow-sm hover:shadow-md border border-gray-100 z-20"
                >
                  ← Back to Form
                </motion.button>
                {!isMobile && (
                  <motion.button
                    onClick={() => {
                      setPresentationMode(true);
                      setCurrentQuoteIndex(0);
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="absolute top-7 right-4 px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs md:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 md:gap-2 shadow-sm hover:shadow-md z-20"
                    style={{ color: '#ffffff' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#ffffff' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span style={{ color: '#ffffff' }}>Presentation Mode</span>
                  </motion.button>
                )}
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

      {/* Presentation Mode - Full Screen (Desktop only) */}
      <AnimatePresence>
        {presentationMode && !isMobile && backgroundQuotes.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              backgroundImage: PRESENTATION_BACKGROUND 
                ? (PRESENTATION_BACKGROUND.startsWith('linear-gradient') || PRESENTATION_BACKGROUND.startsWith('radial-gradient'))
                  ? PRESENTATION_BACKGROUND
                  : `url(${PRESENTATION_BACKGROUND})`
                : 'linear-gradient(to bottom right, rgb(17, 24, 39), rgb(31, 41, 55), rgb(17, 24, 39))',
              backgroundSize: PRESENTATION_BACKGROUND && !PRESENTATION_BACKGROUND.startsWith('linear-gradient') && !PRESENTATION_BACKGROUND.startsWith('radial-gradient')
                ? 'cover'
                : 'auto',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {/* Dark overlay for presentation mode */}
            {PRESENTATION_BACKGROUND && !PRESENTATION_BACKGROUND.startsWith('linear-gradient') && !PRESENTATION_BACKGROUND.startsWith('radial-gradient') && (
              <div 
                className="fixed inset-0 z-0"
                style={{
                  backgroundColor: `rgba(0, 0, 0, ${PRESENTATION_OVERLAY_OPACITY})`,
                }}
              />
            )}

            {/* Exit button */}
            <button
              onClick={() => setPresentationMode(false)}
              className="absolute top-2 right-2 md:top-4 md:right-4 px-3 py-2 md:px-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-lg text-xs md:text-sm font-medium transition-all duration-200 flex items-center gap-1 md:gap-2 border border-white/20 z-10"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="hidden sm:inline">Exit</span>
            </button>

            {/* Quote Display */}
            <motion.div
              key={currentQuoteIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-16 flex flex-col"
              style={{ maxHeight: '90vh' }}
            >
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-12 lg:p-16 border-2 border-white/20 shadow-2xl flex-1 flex flex-col overflow-hidden">
                <div className="text-center flex-1 flex flex-col justify-center overflow-y-auto custom-scrollbar pr-2">
                  <p
                    className="text-white text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-medium leading-relaxed mb-4 sm:mb-6 md:mb-8 lg:mb-12 px-2"
                    dir={isRTL(backgroundQuotes[currentQuoteIndex].quote) ? 'rtl' : 'ltr'}
                    style={{
                      textAlign: isRTL(backgroundQuotes[currentQuoteIndex].quote) ? 'right' : 'left',
                      direction: isRTL(backgroundQuotes[currentQuoteIndex].quote) ? 'rtl' : 'ltr',
                      textShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    {backgroundQuotes[currentQuoteIndex].quote}
                  </p>
                  <p
                    className="text-white/90 text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl italic font-medium mt-4 sm:mt-6 flex-shrink-0"
                    dir={isRTL(backgroundQuotes[currentQuoteIndex].full_name) ? 'rtl' : 'ltr'}
                    style={{
                      textAlign: isRTL(backgroundQuotes[currentQuoteIndex].full_name) ? 'right' : 'left',
                      direction: isRTL(backgroundQuotes[currentQuoteIndex].full_name) ? 'rtl' : 'ltr',
                      textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    <span className="inline-flex items-center gap-2 sm:gap-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.9 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {backgroundQuotes[currentQuoteIndex].full_name}
                    </span>
                  </p>
                </div>
              </div>

              {/* Quote counter */}
              <div className="text-center mt-4 sm:mt-6 flex-shrink-0">
                <p className="text-white/60 text-sm sm:text-base md:text-lg">
                  {currentQuoteIndex + 1} / {backgroundQuotes.length}
                </p>
              </div>
            </motion.div>


            {/* Keyboard navigation hint */}
            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none hidden md:block">
              <p className="text-white/40 text-sm">
              Created by
              <span className="font-medium text-white hover:text-white/90 transition-colors"> RM</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
