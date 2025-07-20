export interface Photo {
  id: number;
  date: string;
  location: string;
  filename: string;
  format: "portrait" | "landscape";
  cover?: boolean;
}

export interface Memory {
  id: number;
  name: string;
  dark: boolean;
  photos: Photo[];
  titlePosition: "string";
}

export type Memories = Memory[];

export type PartialPhoto = Partial<Photo>;
export type PartialMemory = Partial<Memory>;
