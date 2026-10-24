export type TaskStatus = "awaiting_payment" | "ongoing" | "scheduled" | "history" | "waiting" | "cancelled" | "rejected";

export type ProviderVerificationStatus = "pending" | "verified" | "rejected";

export type Provider = {
  id: string;
  name: string;
  title: string;
  category: string;
  location: string;
  rating: number;
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
  category: string;
  location: string;
  budget: number;
  date: string;
  status: TaskStatus;
  provider?: Provider;
  note: string;
  perspective?: "client" | "provider";
  imageUrl?: string;
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
  rating: number;
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
  createdAt: string;
};
