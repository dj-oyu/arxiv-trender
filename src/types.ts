export interface Paper {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  metadata: {
    category: string;
    comments: number;
    date: string;
  };
}

export interface ApiResponse {
  success: boolean;
  data: Paper[];
  error?: string;
}
