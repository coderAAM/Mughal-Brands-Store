export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  featured: boolean;
  stock: number;
  warranty_text: string | null;
  shipping_text: string | null;
  authenticity_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string | null;
  product_id: string | null;
  product_name: string;
  product_price: number;
  product_image_url: string | null;
  quantity: number;
  total_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  created_at: string;
}
