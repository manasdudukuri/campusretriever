
export enum ItemType {
  LOST = 'LOST',
  FOUND = 'FOUND'
}

export enum ItemCategory {
  ELECTRONICS = 'Electronics',
  CLOTHING = 'Clothing',
  ACCESSORIES = 'Accessories',
  BOOKS = 'Books',
  KEYS = 'Keys',
  ID_CARDS = 'ID Cards',
  OTHER = 'Other'
}

export interface CampusHub {
  id: string;
  name: string;
  description: string;
  mapLink: string; // Google Maps Directions Link
}

export interface ClassSession {
  room: string;
  startTime: string; // HH:mm 24h format
  endTime: string;
  subject: string;
}

export interface User {
  email: string;
  verified: boolean;
}

export interface ResolutionDetails {
  resolvedBy: string;
  contactInfo: string;
  resolutionDate: string;
  notes?: string;
  exchangeMethod: 'P2P_PIN' | 'SECURITY_ESCROW';
}

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  description: string;
  category: ItemCategory;
  location: string;
  date: string;
  timeLost?: string;
  imageUrl?: string;
  reporterImage?: string;
  contactName: string;
  contactEmail: string;
  status: 'OPEN' | 'RESOLVED' | 'PENDING_PICKUP'; // PENDING_PICKUP for handshake phase
  resolutionDetails?: ResolutionDetails;
  aiTags: string[];
  condition?: string;
  
  // Feature: Identity Shield (OCR)
  ocrDetectedText?: string;
  
  // Feature: Zero-Knowledge Verification
  quizQuestion?: string;
  quizOptions?: string[]; // Array of 3 strings (1 correct, 2 decoys)
  quizCorrectAnswer?: string; // The correct string (hashed in real app, plain for demo)
  
  // Feature: Urgency & Notification Tiering
  isUrgent?: boolean;
  
  // Feature: Secure Retrieval Protocol
  isHighValue?: boolean;
  
  // Feature: Safe Drop-off Logic
  isMovedToHub?: boolean;
  dropOffHubId?: string;
  
  // Feature: Secure Handshake
  exchangePin?: string; // 4-digit PIN generated on claim approval
}

export interface MatchResult {
  itemId: string;
  confidence: number;
  reasoning: string;
}

export interface ClaimRequest {
  id: string;
  itemId: string;
  itemTitle: string;
  claimantName: string;
  claimantContact: string;
  claimantImage?: string;
  answerToQuestion?: string; // Used if manual verification
  quizPassed?: boolean; // Used if Zero-Knowledge verification
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  timestamp: string;
}

export interface Notification {
  id: string;
  type: 'MATCH_ALERT' | 'CLAIM_RECEIVED' | 'CLAIM_UPDATE' | 'URGENCY_ALERT' | 'SAFETY_TIMER' | 'IDENTITY_MATCH' | 'FRAUD_ALERT';
  title: string;
  message: string;
  read: boolean;
  relatedItemId?: string;
}

export type ViewState = 'LOGIN' | 'DASHBOARD' | 'REPORT_LOST' | 'REPORT_FOUND' | 'MATCHES' | 'ABOUT' | 'CAMERA_TRACKING';
