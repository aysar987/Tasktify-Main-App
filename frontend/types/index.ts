export type TaskStatus = "ongoing" | "scheduled" | "history" | "waiting" | "cancelled" | "rejected";

export type Provider = {
  id: string;
  name: string;
  title: string;
  category: string;
  location: string;
  rating: number;
  jobs: number;
  verified: boolean;
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
};

export type Profile = {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  avatarUrl?: string;
  provider?: Provider;
};

export type Conversation = {
  id: string;
  provider: Provider;
  counterpartName: string;
  counterpartInitials: string;
  lastMessage: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
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

export type PaymentStatus = "pending" | "settlement" | "capture" | "deny" | "cancel" | "expire" | "failure";

export type Payment = {
  id: string;
  taskId: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  snapToken?: string;
  paymentType?: string;
  paidAt?: string;
  createdAt: string;
};
