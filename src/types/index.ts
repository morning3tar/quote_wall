import { Timestamp } from 'firebase/firestore';

export interface Quote {
  id: string;
  full_name: string;
  quote: string;
  created_at: Timestamp;
}

export interface FormData {
  full_name: string;
  quote: string;
} 