export type Role = "ADMIN" | "CUSTOMER";

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export type CouponDiscountType = "PERCENTAGE" | "FIXED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  _count?: { products: number };
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  active: boolean;
  showInHero: boolean;
  ctaLabel?: string | null;
  sortOrder: number;
  productIds?: string[];
  products?: Product[];
  _count?: { products: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductOptionValue {
  value: string;
  image?: string | null;
}

export interface ProductOption {
  name: string;
  values: ProductOptionValue[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  attributes: Record<string, string>;
  price: string | number | null;
  salePrice: string | number | null;
  stock: number;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string | number;
  salePrice: string | number | null;
  stock: number;
  sku: string;
  images: string[];
  optionConfig?: ProductOption[] | null;
  featured: boolean;
  newArrival: boolean;
  active: boolean;
  categoryId: string;
  category?: Pick<Category, "id" | "name" | "slug">;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  variant?: ProductVariant | null;
  quantity: number;
}

export interface ShippingAddress {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
}

export interface SavedAddress {
  id: string;
  label: string | null;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string | null;
  variantAttributes?: Record<string, string> | null;
  quantity: number;
  price: string | number;
  product?: Pick<Product, "id" | "name" | "slug" | "images">;
  variant?: ProductVariant | null;
}

export interface ShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  active?: boolean;
  sortOrder?: number;
  states?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  status: OrderStatus;
  subtotal: string | number;
  shipping: string | number;
  shippingMethod?: string | null;
  discount: string | number;
  total: string | number;
  couponCode: string | null;
  paymentProvider: string | null;
  paymentReference: string | null;
  paymentStatus: PaymentStatus;
  paymentReceiptUrl?: string | null;
  paymentPayerBank?: string | null;
  paymentAmount?: string | number | null;
  paymentNote?: string | null;
  shippingAddress: ShippingAddress;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  items: OrderItem[];
}

export interface Coupon {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  amount: string | number;
  expiresAt: string;
  active: boolean;
  maxRedemptions: number;
  redemptionCount: number;
  createdAt: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
