class ExtraQuery {
  data: Map<string, string>;
  constructor() {
    this.data = new Map<string, string>();
  }

  formatQueryString() {
    return Array.from(this.data.keys())
      .map((k) => `${k}=${this.data.get(k)}`)
      .join("&");
  }

  setKeyBool(key: string, value: boolean) {
    if (value) this.data.set(key, "true");
    else this.data.delete(key);
  }

  setKey(key: string, value: string) {
    this.data.set(key, value);
  }

  removeKey(key: string) {
    this.data.delete(key);
  }

  clearKey() {
    this.data.clear();
  }
}

export { ExtraQuery };
