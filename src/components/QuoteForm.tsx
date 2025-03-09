import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FormData } from '@/types';
import Image from 'next/image';

function isRTL(text: string) {
  const rtlRegex = /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlRegex.test(text);
}

interface QuoteFormProps {
  onQuoteAdded?: () => void;
  onSuccessfulSubmit?: () => void;
}

export default function QuoteForm({ onQuoteAdded, onSuccessfulSubmit }: QuoteFormProps) {
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    quote: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [step, setStep] = useState<'name' | 'quote'>('name');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'name' && formData.full_name.trim()) {
      setStep('quote');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, 'quotes'), {
        full_name: formData.full_name.trim(),
        quote: formData.quote.trim(),
        created_at: serverTimestamp()
      });

      onQuoteAdded?.();
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error submitting quote:', err);
      setError('Failed to submit quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewQuotes = () => {
    onSuccessfulSubmit?.();
  };

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {step === 'name' && (
          <motion.form
            key="nameForm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-white shadow-lg">
                  <Image
                    src="/isu-logo.png"
                    alt="ISU Logo"
                    fill
                    className="object-contain p-2"
                    priority
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Welcome to Nowruz Quotes Wall
                </h2>
                <p className="text-gray-900 font-normal">
                  Submit your best quote and stand a chance to win a prize! 🏆
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-900 text-left font-normal">
                  1️⃣ Enter your full name to get started.
                </p>
                <p className="text-gray-900 text-left font-normal">
                  2️⃣ Write your best quote! be original, inspiring, or funny!
                </p>
                <p className="text-gray-900 text-left font-normal">
                  3️⃣ Your quote will be displayed on the live quote wall for everyone to see.
                </p>
              </div>
            </div>
            <div>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="message-input w-full px-4 py-3 text-gray-900 placeholder-gray-400 text-lg"
                placeholder="Enter your full name..."
                maxLength={100}
                autoFocus
                dir={isRTL(formData.full_name) ? 'rtl' : 'ltr'}
                style={{ 
                  textAlign: isRTL(formData.full_name) ? 'right' : 'left'
                }}
              />
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-4 bg-white hover:bg-gray-50 rounded-full text-primary font-medium transition-all duration-200 shadow-sm hover:shadow-md border border-gray-100"
            >
              Continue
            </motion.button>
          </motion.form>
        )}

        {step === 'quote' && (
          <motion.form
            key="quoteForm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-gray-900">
                Hi, {formData.full_name}! ✨
              </h2>
              <p className="text-gray-900 text-center font-normal">
                Share your quote with everyone!
              </p>
            </div>
            <div className="space-y-2">
              <motion.textarea
                whileFocus={{ scale: 1.01 }}
                required
                value={formData.quote}
                onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                className="message-input w-full px-4 py-3 text-gray-900 placeholder-gray-400 resize-none text-lg"
                placeholder="Type your message..."
                rows={4}
                maxLength={500}
                autoFocus
                dir={isRTL(formData.quote) ? 'rtl' : 'ltr'}
                style={{ 
                  textAlign: isRTL(formData.quote) ? 'right' : 'left'
                }}
              />
              <div className="flex justify-end">
                <span className="text-xs text-gray-400">
                  {formData.quote.length}/400
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center gap-4">
              <motion.button
                type="button"
                onClick={() => setStep('name')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-white hover:bg-gray-50 rounded-full text-gray-700 font-medium transition-all duration-200 shadow-sm hover:shadow-md border border-gray-100"
              >
                Back
              </motion.button>
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 px-4 bg-white hover:bg-gray-50 rounded-full text-primary font-medium transition-all duration-200 shadow-sm hover:shadow-md border border-gray-100 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    Sending...
                  </>
                ) : (
                  'Share Quote'
                )}
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 bg-red-50 text-error rounded-lg text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={handleViewQuotes}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4"
            >
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L14.4 7.2L20 8.4L16 12.4L17.2 18L12 15.2L6.8 18L8 12.4L4 8.4L9.6 7.2L12 2Z" fill="#007AFF"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  Quote Shared Successfully!
                </h3>
                <p className="text-gray-600">
                  Your quote has been added to the quotes wall.
                </p>
                <div className="pt-2">
                  <motion.button
                    onClick={handleViewQuotes}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 px-4 bg-[#007AFF] hover:bg-[#0063CC] rounded-full text-white font-medium transition-all duration-200 shadow-lg shadow-blue-200"
                  >
                    View Quotes Wall
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
} 