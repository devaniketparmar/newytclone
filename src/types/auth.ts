// Authentication Types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  location?: string;
  websiteUrl?: string;
  verified: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResult {
  user: User;
  token: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  role: 'user' | 'creator' | 'admin';
  iat: number;
  exp: number;
  sessionId: string;
  requires2FA?: boolean;
}

export interface SessionData {
  user: User;
  sessionId: string;
  expiresAt: Date;
}

export interface PasswordResetData {
  email: string;
}

export interface PasswordResetConfirmData {
  token: string;
  password: string;
}

export interface TwoFactorSetupData {
  userId: string;
  secret: string;
  qrCode: string;
}

export interface TwoFactorVerifyData {
  userId: string;
  code: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  agreeToTerms: boolean;
}

export interface PasswordResetFormData {
  email: string;
}

export interface PasswordResetConfirmFormData {
  password: string;
  confirmPassword: string;
}

// Channel Types
export interface Channel {
  id: string;
  userId: string;
  name: string;
  description?: string;
  customUrl?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  trailerVideoId?: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Video Types
export interface Video {
  id: string;
  channelId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl: string;
  duration: number;
  fileSize: number;
  resolution?: string;
  categoryId?: number;
  privacy: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
  status: 'PROCESSING' | 'READY' | 'FAILED';
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  scheduledAt?: Date;
}

// Category Types
export interface Category {
  id: number;
  name: string;
  description?: string;
  iconUrl?: string;
  parentId?: number;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Search Types
export interface SearchFilters {
  category?: number;
  duration?: 'short' | 'medium' | 'long';
  uploadDate?: 'hour' | 'day' | 'week' | 'month' | 'year';
  sortBy?: 'relevance' | 'date' | 'views' | 'rating';
  quality?: 'hd' | 'sd';
}

export interface SearchResults {
  videos: Video[];
  channels: Channel[];
  playlists: Playlist[];
  totalResults: number;
  query: string;
  filters: SearchFilters;
}

// Playlist Types
export interface Playlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  privacy: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
  videoCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics Types
export interface VideoAnalytics {
  videoId: string;
  date: Date;
  views: number;
  uniqueViewers: number;
  watchTime: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  subscribersGained: number;
  subscribersLost: number;
}

export interface ChannelAnalytics {
  channelId: string;
  date: Date;
  views: number;
  uniqueViewers: number;
  watchTime: number;
  subscribersGained: number;
  subscribersLost: number;
  videosPublished: number;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'NEW_VIDEO' | 'NEW_COMMENT' | 'NEW_LIKE' | 'NEW_SUBSCRIPTION' | 'TRENDING' | 'SYSTEM';
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

// Utility Types
export type Status = 'idle' | 'loading' | 'success' | 'error';

export interface LoadingState {
  status: Status;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Form Validation Types
export interface FormErrors {
  [key: string]: string | undefined;
}

export interface FormState<T> {
  data: T;
  errors: FormErrors;
  isSubmitting: boolean;
  isValid: boolean;
}
