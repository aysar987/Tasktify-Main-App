export type Route =
  | "login"
  | "register"
  | "home"
  | "market"
  | "provider"
  | "activity"
  | "request"
  | "chat"
  | "profile";

export type Provider = {
  id: number;
  name: string;
  role: string;
  experience: string;
  location: string;
  rating: number;
  category: string;
  about: string;
};

export type TaskStatus = "Berjalan" | "Terjadwal" | "Selesai";

export type Task = {
  id: number;
  provider: string;
  title: string;
  description: string;
  date: string;
  status: TaskStatus;
};

export type Chat = {
  id: number;
  name: string;
  role: string;
  lastMessage: string;
  date: string;
  unread?: boolean;
};
