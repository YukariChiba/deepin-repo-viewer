import { defineStore } from "pinia";

type SnackbarMessage = {
  text: string;
  color: string;
};

export const useSnackbarStore = defineStore("snackbarStore", {
  state: () => ({
    queue: [] as SnackbarMessage[],
  }),
  actions: {
    add(msg: SnackbarMessage) {
      this.queue.push(msg);
    },
  },
});
