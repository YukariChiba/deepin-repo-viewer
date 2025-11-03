type DataItemArchBinary = Record<string, string>;

type DataItem = {
  source: string;
  component: string;
  data: {
    source: string;
    binary: Record<string, DataItemArchBinary>;
    github?: {
      group?: string;
    };
  };
  id: string;
};

type PaginationData = {
  first: number;
  prev: number | null;
  next: number;
  last: number;
  pages: number;
  items: number;
  data: DataItem[];
};

export type { PaginationData, DataItem };
