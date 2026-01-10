// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  college: string;
  createdAt: string;
  trustScore: number;
  totalRatings: number;
  totalExchanges: number;
  badge: 'new' | 'trusted' | 'top-seller';
}

// Category Types
export type Category = 'books' | 'cycles' | 'electronics' | 'hostel-items';

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'books', label: 'Books' },
  { value: 'cycles', label: 'Cycles' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'hostel-items', label: 'Hostel Items' },
];

// Campus Location Types
export type CampusLocation = 'library' | 'canteen' | 'department' | 'hostel' | 'main-gate';

export const CAMPUS_LOCATIONS: { value: CampusLocation; label: string }[] = [
  { value: 'library', label: 'Library' },
  { value: 'canteen', label: 'Canteen' },
  { value: 'department', label: 'Department' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'main-gate', label: 'Main Gate' },
];

// Listing Types
export type ListingStatus = 'available' | 'reserved' | 'sold';

export interface Listing {
  id: string;
  userId: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  location: CampusLocation;
  images: string[];
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
}

// Need Request Types
export type NeedStatus = 'open' | 'matched' | 'closed';

export interface NeedRequest {
  id: string;
  userId: string;
  title: string;
  description: string;
  maxBudget: number;
  category: Category;
  preferredLocation: CampusLocation;
  status: NeedStatus;
  createdAt: string;
  expiresAt: string;
}

// Match Types
export type MatchStatus = 'pending' | 'chatting' | 'meeting-scheduled' | 'completed' | 'cancelled';

export interface Match {
  id: string;
  listingId?: string;
  needRequestId?: string;
  sellerId: string;
  buyerId: string;
  status: MatchStatus;
  matchScore: number;
  suggestedLocation: CampusLocation;
  createdAt: string;
  updatedAt: string;
}

// Chat Types
export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  isSystemMessage: boolean;
  createdAt: string;
}

// Rating Types
export interface Rating {
  id: string;
  matchId: string;
  fromUserId: string;
  toUserId: string;
  overallRating: number;
  communication: number;
  itemAccuracy: number;
  punctuality: number;
  review?: string;
  createdAt: string;
}

// Notification Types
export type NotificationType = 'match' | 'message' | 'rating-reminder' | 'request-expiring' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  linkTo?: string;
  createdAt: string;
}
