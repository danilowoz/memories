export interface Photo {
  id: number;
  date: string;
  location: string;
  enabled: boolean;
  thumbnailURL: string | null;
  filename: string;
  mimeType: string;
  filesize: number;
  width: number;
  height: number;
  focalX: number;
  focalY: number;
}

export interface Memory {
  id: number;
  name: string;
  dark: boolean | null;
  enabled: boolean;
  photos: Photo[];
}

export type Memories = Memory[];

export type PartialPhoto = Partial<Photo>;
export type PartialMemory = Partial<Memory>;
