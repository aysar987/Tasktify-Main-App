export type TaskStatus = "awaiting_payment" | "ongoing" | "scheduled" | "history" | "waiting" | "cancelled" | "rejected";

export type ProviderVerificationStatus = "pending" | "verified" | "rejected";

export type Provider = {
  id: string;
  name: string;
  title: string;
  category: string;
  location: string;
  /** Average review score; null while there are no reviews ("Baru"). */
  rating: number | null;
  /** Number of reviews. */
  reviewCount: number;
  jobs: number;
  verified: boolean;
  verificationStatus: ProviderVerificationStatus;
  verificationNote?: string;
  hasKtp: boolean;
  priceFrom: number;
  initials: string;
  bio?: string;
};

export type Task = {
  id: string;
  title: string;
  location: string;
  budget: number;
  date: string;
  status: TaskStatus;
  provider?: Provider;
  note: string;
  perspective?: "client" | "provider";
  /** API paths of the task photos; load with getTaskImageUrl. */
  images: string[];
  /** Client name; only sent to the provider assigned to the task. */
  clientName?: string;
};

export type Profile = {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  avatarUrl?: string;
  role: "client" | "admin";
  provider?: Provider;
  /** "Verifikasi akun": unlocks taking tasks and opening a lapak. */
  verification: AccountVerification;
  /** Acceptance of the Syarat & Ketentuan / Kebijakan Privasi. */
  terms: TermsStatus;
};

export type TermsStatus = {
  currentVersion: string;
  acceptedVersion?: string;
  acceptedAt?: string;
  /** True when the current version still has to be accepted. */
  required: boolean;
};

export type AccountVerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export type AccountVerification = {
  status: AccountVerificationStatus;
  /** Rejection reason from the admin. */
  note?: string;
  submittedAt?: string;
  verifiedAt?: string;
  /** In-app page to return to after approval (e.g. the task the user wanted to take). */
  returnTo?: string;
};

export type Conversation = {
  id: string;
  provider: Provider;
  listing?: { id: string; name: string; category: string };
  counterpartName: string;
  counterpartInitials: string;
  lastMessage: string;
  updatedAt: string;
  unreadCount: number;
  /** The task this conversation is about; missing for general and lapak chats. */
  task?: ConversationTask;
  /** When sending stops (7 days after the task ended). */
  closesAt?: string;
  /** True once the task ended more than 7 days ago: messages can be read but not sent. */
  readOnly: boolean;
};

export type ConversationTask = {
  id: string;
  title: string;
  status: TaskStatus;
  budget: number;
  schedule: string;
  /** API paths of the task photos; load with getTaskImageUrl. */
  images: string[];
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  href?: string;
  readAt?: string;
  createdAt: string;
};

export type TaskLocation = {
  latitude: number;
  longitude: number;
  updatedAt: string;
};

export type Rating = {
  id: string;
  score: number;
  review: string;
  clientName: string;
  taskTitle: string;
  createdAt: string;
};

export type PaymentStatus = "pending" | "settlement" | "capture" | "deny" | "cancel" | "expire" | "failure" | "released" | "refunded";
export type PaymentMethod = "online" | "cash";

export type Banner = {
  id: string;
  href: string;
  imageUrl: string;
  mobileImageUrl: string;
  desktopImageUrl: string;
  sortOrder: number;
  active: boolean;
};

export type MarketplaceListingService = {
  name: string;
  description: string;
  price: number;
  unit: "per_pasangan" | "per_item" | "per_jam" | "per_meter" | "per_kg" | "per_unit" | "sekali_datang";
  duration: string;
  isActive: boolean;
};

export type MarketplaceOperatingHours = Partial<Record<
  "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
  { isOpen: boolean; openTime: string; closeTime: string }
>>;

export type MarketplaceListing = {
  id: string;
  providerId?: string;
  name: string;
  slug: string;
  category: string;
  location: string;
  description: string;
  priceFrom: number;
  /** Average review score; null while there are no reviews ("Baru"). */
  rating: number | null;
  /** Number of reviews. */
  reviewCount: number;
  jobs: number;
  verified: boolean;
  verificationStatus: ProviderVerificationStatus;
  verificationNote?: string;
  status: "active" | "inactive" | "pending";
  imageUrl?: string;
  whatsapp: string;
  fullAddress: string;
  serviceTypes: ("buyer_location" | "provider_travel" | "pickup_delivery")[];
  operatingHours: MarketplaceOperatingHours;
  instagramUrl: string;
  tiktokUrl: string;
  termsWarranty: string;
  services?: MarketplaceListingService[];
};

export type Payment = {
  id: string;
  taskId: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  snapToken?: string;
  paymentType?: string;
  paidAt?: string;
  /** When the provider confirmed receiving the cash. */
  cashConfirmedAt?: string;
  createdAt: string;
};
