import { create } from "zustand";

export const useAuthStore = create((set) => ({
  authUser: { name: "John", id: 123, age: 25 },
  isLoggedIn: false,
  login: () => {
    console.log("Logged in");
    // You can use `set()` here to update state
    set({ isLoggedIn: true });
    // Simulate login delay
    setTimeout(() => {
      set({ isLoggedIn: false });
    }, 1000);
  },
}));
