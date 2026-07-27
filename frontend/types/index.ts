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
