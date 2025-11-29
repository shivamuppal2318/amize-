export interface Sound {
  id: string;
  title: string;
  artistName: string | null;
  soundUrl: string;
  duration: number;
  isOriginal: boolean;
  createdAt: string;
  updatedAt: string;
}