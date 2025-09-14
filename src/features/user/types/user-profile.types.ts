// ===== USER PROFILE TYPES =====
import type {
  CurrencyCode,
  DatabaseUserProfile,
  OrderStatus,
  UserRole,
} from "@/shared/types";

// Re-export types for components that need them
export type { CurrencyCode, OrderStatus, UserRole };

// Use the enhanced UserProfile from shared types or create a specific interface for this feature
export interface UserProfileWithPreferences extends DatabaseUserProfile {
  readonly email: string;
  readonly avatar_url?: string;
  readonly language_preference: "en" | "ru";
}

// Legacy alias for backward compatibility
export type UserProfile = UserProfileWithPreferences;

// ===== USER PREFERENCES =====

export interface UserPreferences {
  readonly currency: CurrencyCode;
  readonly language: "en" | "ru";
  readonly notifications: {
    readonly email_notifications: boolean;
    readonly order_updates: boolean;
    readonly marketing_emails: boolean;
    readonly chat_messages: boolean;
  };
  readonly display: {
    readonly items_per_page: number;
    readonly default_sort: "newest" | "oldest" | "price_high" | "price_low";
    readonly theme: "light" | "dark" | "auto";
  };
}

// ===== ORDER HISTORY TYPES =====

export interface UserOrder {
  readonly id: string;
  readonly status: OrderStatus;
  readonly total_amount: number;
  readonly currency_code: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly items: UserOrderItem[];
  readonly delivery_address?: DeliveryAddress;
}

export interface UserOrderItem {
  readonly id: string;
  readonly gemstone: {
    readonly id: string;
    readonly name: string;
    readonly color: string;
    readonly cut: string;
    readonly weight_carats: number;
    readonly serial_number: string;
  };
  readonly quantity: number;
  readonly unit_price: number;
  readonly line_total: number;
}

// OrderStatus imported from @/shared/types

export interface DeliveryAddress {
  readonly street: string;
  readonly city: string;
  readonly state: string;
  readonly zip_code: string;
  readonly country: string;
}

// ===== USER ACTIVITY TYPES =====

export interface UserActivity {
  readonly id: string;
  readonly type: ActivityType;
  readonly description: string;
  readonly timestamp: string;
  readonly metadata?: Record<string, any>;
}

export type ActivityType =
  | "order_placed"
  | "order_status_changed"
  | "profile_updated"
  | "password_changed"
  | "chat_message"
  | "favorite_added"
  | "favorite_removed"
  | "cart_updated";

// ===== API REQUEST/RESPONSE TYPES =====

// Profile update request
export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  avatar_url?: string;
  preferred_currency?: CurrencyCode | null;
  language_preference?: "en" | "ru";
  email_notifications?: boolean;
  order_updates?: boolean;
  marketing_emails?: boolean;
}

export interface UpdateProfileResponse {
  success: boolean;
  profile?: UserProfileWithPreferences;
  error?: string;
}

// Password change request
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  error?: string;
}

// Order history request
export interface GetOrderHistoryRequest {
  page?: number;
  limit?: number;
  status?: OrderStatus[];
  date_from?: string;
  date_to?: string;
}

export interface GetOrderHistoryResponse {
  success: boolean;
  orders: UserOrder[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  error?: string;
}

// Activity history request
export interface GetActivityHistoryRequest {
  page?: number;
  limit?: number;
  type?: ActivityType[];
  date_from?: string;
  date_to?: string;
}

export interface GetActivityHistoryResponse {
  success: boolean;
  activities: UserActivity[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  error?: string;
}

// ===== COMPONENT PROPS TYPES =====

// Profile page props
export interface ProfilePageProps {
  user: UserProfileWithPreferences;
  onUpdate: (updates: UpdateProfileRequest) => Promise<void>;
}

// Order history props
export interface OrderHistoryProps {
  orders: UserOrder[];
  loading: boolean;
  onOrderSelect: (order: UserOrder) => void;
  onLoadMore: () => void;
  hasMore: boolean;
}

// Profile settings props
export interface ProfileSettingsProps {
  user: UserProfileWithPreferences;
  preferences: UserPreferences;
  onUpdateProfile: (updates: UpdateProfileRequest) => Promise<void>;
  onUpdatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  onChangePassword: (request: ChangePasswordRequest) => Promise<void>;
}

// Activity feed props
export interface ActivityFeedProps {
  activities: UserActivity[];
  loading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
}

// ===== HOOK TYPES =====

export interface UseUserProfileReturn {
  profile: UserProfileWithPreferences | null;
  preferences: UserPreferences | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: UpdateProfileRequest) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  changePassword: (request: ChangePasswordRequest) => Promise<void>;
  refresh: () => void;
}

export interface UseOrderHistoryReturn {
  orders: UserOrder[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  loadOrders: (request?: GetOrderHistoryRequest) => Promise<void>;
  loadMore: () => void;
  refresh: () => void;
}

export interface UseActivityHistoryReturn {
  activities: UserActivity[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  loadActivities: (request?: GetActivityHistoryRequest) => Promise<void>;
  loadMore: () => void;
  refresh: () => void;
}

// ===== UTILITY TYPES =====

export interface ProfileStats {
  readonly totalOrders: number;
  readonly totalSpent: number;
  readonly averageOrderValue: number;
  readonly memberSince: string;
  readonly favoriteGemstones: number;
  readonly cartItems: number;
}

export interface ProfileFormData {
  name: string;
  phone: string;
  preferred_currency: CurrencyCode;
  language_preference: "en" | "ru";
  email_notifications: boolean;
  order_updates: boolean;
  marketing_emails: boolean;
}

// ===== ERROR TYPES =====

export class UserProfileError extends Error {
  constructor(
    public code:
      | "PROFILE_NOT_FOUND"
      | "UPDATE_FAILED"
      | "CREATE_FAILED"
      | "VALIDATION_ERROR"
      | "PERMISSION_DENIED",
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "UserProfileError";
  }
}

// ===== CONFIGURATION =====

export interface UserProfileConfig {
  defaultItemsPerPage: number;
  maxItemsPerPage: number;
  activityPageSize: number;
  orderHistoryPageSize: number;
  profileUpdateTimeout: number;
}

export const DEFAULT_USER_PROFILE_CONFIG: UserProfileConfig = {
  defaultItemsPerPage: 10,
  maxItemsPerPage: 50,
  activityPageSize: 20,
  orderHistoryPageSize: 10,
  profileUpdateTimeout: 5000,
};

// ===== ORDER STATUS CONFIGURATION =====

export const ORDER_STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "secondary" as const,
    description: "Your order is being processed",
  },
  confirmed: {
    label: "Confirmed",
    color: "default" as const,
    description: "Your order has been confirmed",
  },
  processing: {
    label: "Processing",
    color: "default" as const,
    description: "Your order is being prepared",
  },
  shipped: {
    label: "Shipped",
    color: "default" as const,
    description: "Your order has been shipped",
  },
  delivered: {
    label: "Delivered",
    color: "default" as const,
    description: "Your order has been delivered",
  },
  cancelled: {
    label: "Cancelled",
    color: "destructive" as const,
    description: "Your order has been cancelled",
  },
} as const;
