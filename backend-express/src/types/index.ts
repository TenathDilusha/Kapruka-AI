export interface Product {
  id: string;
  name: string;
  summary?: string;
  price: { amount: number | null; currency: string };
  image_url?: string | null;
  url?: string;
  in_stock: boolean;
  category?: { name: string };
}

export interface BundleItem {
  label: string;
  search_query: string;
  category?: string | null;
  product?: Product | null;
  products?: Product[];
}

export interface GiftBundle {
  id: string;
  theme: string;
  occasion: string;
  emotional_description: string;
  items: BundleItem[];
  estimated_budget?: string | null;
  products?: Product[];
}

export interface CartItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  currency: string;
  image_url?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: Product[];
  bundles?: GiftBundle[];
  checkoutUrl?: string;
  orderRef?: string;
  status?: "thinking" | "searching" | "done";
  followUpQuestions?: string[];
  timestamp: number;
}

export interface ChatResponse {
  sessionId: string;
  message: ChatMessage;
  cart: CartItem[];
  statusUpdates?: string[];
}
