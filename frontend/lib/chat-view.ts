import { create } from "zustand";

// True while a single conversation is open full-screen; the app shell hides
// the mobile bottom navigation so the message box can use the whole height.
export const useConversationOpen = create<{ open: boolean; setOpen: (open: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
