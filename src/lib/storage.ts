// LocalStorage persistence layer for GET app
// This will be replaced with Supabase when Cloud is enabled

const STORAGE_KEYS = {
  USER: 'get_current_user',
  USERS: 'get_users',
  LISTINGS: 'get_listings',
  NEED_REQUESTS: 'get_need_requests',
  MATCHES: 'get_matches',
  MESSAGES: 'get_messages',
  RATINGS: 'get_ratings',
  NOTIFICATIONS: 'get_notifications',
} as const;

// Generic storage helpers
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Storage error:', error);
  }
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// User storage
import type { User, Listing, NeedRequest, Match, Message, Rating, Notification } from '@/types';

export const userStorage = {
  getCurrentUser: (): User | null => getItem<User | null>(STORAGE_KEYS.USER, null),
  setCurrentUser: (user: User | null) => setItem(STORAGE_KEYS.USER, user),
  
  getAllUsers: (): User[] => getItem<User[]>(STORAGE_KEYS.USERS, []),
  saveUser: (user: User) => {
    const users = userStorage.getAllUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    setItem(STORAGE_KEYS.USERS, users);
  },
  getUserById: (id: string): User | undefined => {
    return userStorage.getAllUsers().find(u => u.id === id);
  },
  getUserByEmail: (email: string): User | undefined => {
    return userStorage.getAllUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  },
};

// Listing storage
export const listingStorage = {
  getAll: (): Listing[] => getItem<Listing[]>(STORAGE_KEYS.LISTINGS, []),
  save: (listing: Listing) => {
    const listings = listingStorage.getAll();
    const index = listings.findIndex(l => l.id === listing.id);
    if (index >= 0) {
      listings[index] = listing;
    } else {
      listings.push(listing);
    }
    setItem(STORAGE_KEYS.LISTINGS, listings);
  },
  getById: (id: string): Listing | undefined => {
    return listingStorage.getAll().find(l => l.id === id);
  },
  getByUserId: (userId: string): Listing[] => {
    return listingStorage.getAll().filter(l => l.userId === userId);
  },
  delete: (id: string) => {
    const listings = listingStorage.getAll().filter(l => l.id !== id);
    setItem(STORAGE_KEYS.LISTINGS, listings);
  },
};

// Need Request storage
export const needRequestStorage = {
  getAll: (): NeedRequest[] => getItem<NeedRequest[]>(STORAGE_KEYS.NEED_REQUESTS, []),
  save: (request: NeedRequest) => {
    const requests = needRequestStorage.getAll();
    const index = requests.findIndex(r => r.id === request.id);
    if (index >= 0) {
      requests[index] = request;
    } else {
      requests.push(request);
    }
    setItem(STORAGE_KEYS.NEED_REQUESTS, requests);
  },
  getById: (id: string): NeedRequest | undefined => {
    return needRequestStorage.getAll().find(r => r.id === id);
  },
  getByUserId: (userId: string): NeedRequest[] => {
    return needRequestStorage.getAll().filter(r => r.userId === userId);
  },
  delete: (id: string) => {
    const requests = needRequestStorage.getAll().filter(r => r.id !== id);
    setItem(STORAGE_KEYS.NEED_REQUESTS, requests);
  },
};

// Match storage
export const matchStorage = {
  getAll: (): Match[] => getItem<Match[]>(STORAGE_KEYS.MATCHES, []),
  save: (match: Match) => {
    const matches = matchStorage.getAll();
    const index = matches.findIndex(m => m.id === match.id);
    if (index >= 0) {
      matches[index] = match;
    } else {
      matches.push(match);
    }
    setItem(STORAGE_KEYS.MATCHES, matches);
  },
  getById: (id: string): Match | undefined => {
    return matchStorage.getAll().find(m => m.id === id);
  },
  getByUserId: (userId: string): Match[] => {
    return matchStorage.getAll().filter(m => m.sellerId === userId || m.buyerId === userId);
  },
};

// Message storage
export const messageStorage = {
  getAll: (): Message[] => getItem<Message[]>(STORAGE_KEYS.MESSAGES, []),
  save: (message: Message) => {
    const messages = messageStorage.getAll();
    messages.push(message);
    setItem(STORAGE_KEYS.MESSAGES, messages);
  },
  getByMatchId: (matchId: string): Message[] => {
    return messageStorage.getAll().filter(m => m.matchId === matchId);
  },
};

// Rating storage
export const ratingStorage = {
  getAll: (): Rating[] => getItem<Rating[]>(STORAGE_KEYS.RATINGS, []),
  save: (rating: Rating) => {
    const ratings = ratingStorage.getAll();
    ratings.push(rating);
    setItem(STORAGE_KEYS.RATINGS, ratings);
    
    // Update user trust score
    const user = userStorage.getUserById(rating.toUserId);
    if (user) {
      const userRatings = ratingStorage.getByUserId(rating.toUserId);
      const avgRating = userRatings.reduce((sum, r) => sum + r.overallRating, 0) / userRatings.length;
      const totalExchanges = user.totalExchanges + 1;
      
      let badge: User['badge'] = 'new';
      if (totalExchanges >= 25 && avgRating >= 4.5) {
        badge = 'top';
      } else if (totalExchanges >= 10 && avgRating >= 4) {
        badge = 'trusted';
      }
      
      userStorage.saveUser({
        ...user,
        trustScore: Math.round(avgRating * 10) / 10,
        totalRatings: userRatings.length,
        totalExchanges,
        badge,
      });
    }
  },
  getByUserId: (userId: string): Rating[] => {
    return ratingStorage.getAll().filter(r => r.toUserId === userId);
  },
  getByMatchId: (matchId: string): Rating[] => {
    return ratingStorage.getAll().filter(r => r.matchId === matchId);
  },
};

// Notification storage
export const notificationStorage = {
  getAll: (): Notification[] => getItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []),
  save: (notification: Notification) => {
    const notifications = notificationStorage.getAll();
    notifications.push(notification);
    setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
  },
  getByUserId: (userId: string): Notification[] => {
    return notificationStorage.getAll().filter(n => n.userId === userId);
  },
  markAsRead: (id: string) => {
    const notifications = notificationStorage.getAll();
    const index = notifications.findIndex(n => n.id === id);
    if (index >= 0) {
      notifications[index].read = true;
      setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
    }
  },
  markAllAsRead: (userId: string) => {
    const notifications = notificationStorage.getAll();
    notifications.forEach(n => {
      if (n.userId === userId) n.read = true;
    });
    setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
  },
};

// Clear all data (for development)
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}
