export type TaskStatus = "ongoing" | "scheduled" | "history" | "waiting" | "cancelled";

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
};

export type Profile = {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  avatarUrl?: string;
};

export type Conversation = {
  id: string;
  provider: Provider;
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
