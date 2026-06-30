export interface Product {
  id: string;
  name: string;
  summary?: string;
  description?: string;
  price: { amount: number | null; currency: string };
  image_url?: string | null;
  url?: string;
  in_stock: boolean;
  category?: { name: string; slug?: string };
  variants?: Array<{ id: string; name: string; price: { amount: number | null; currency: string }; in_stock: boolean }>;
  stock_level?: string;
}

export interface BundleItem {
  label: string;
  search_query: string;
  category?: string | null;
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

export interface GiftOption {
  id: string;
  label: string;
  short: string;
  prompt: string;
  query: string;
  product_id: string | null;
  image_url: string | null;
  sample_product: string | null;
  price: { amount: number | null; currency: string } | null;
}
