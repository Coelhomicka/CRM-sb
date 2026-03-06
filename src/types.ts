export interface User {
  id: number;
  email: string;
  role: 'customer' | 'seller';
  points: number;
}

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  category_id: number;
  category_name?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
}

export interface Order {
  id: number;
  user_id: number;
  customer_email?: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_id?: string;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
}

export interface Stats {
  revenue: number;
  monthlyRevenue: number;
  avgTicket: number;
  newCustomers: number;
  topProducts: { name: string; total_sold: number }[];
  topCustomers: { name: string; phone: string; total_spent: number }[];
  revenueHistory: { date: string; total: number }[];
}
