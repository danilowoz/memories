export interface Photo {
  id: number;
  date?: string;
  location?: string;
  filename?: string;
  format: string;
  cover?: boolean;
}

export interface Memory {
  id: number | string;
  name: string;
  dark: boolean;
  photos: Photo[];
}

export type Memories = Memory[];

export type PartialPhoto = Partial<Photo>;
export type PartialMemory = Partial<Memory>;
