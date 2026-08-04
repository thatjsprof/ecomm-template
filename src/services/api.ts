import api from "@/lib/api";
import type {
  ApiResponse,
  CartItem,
  Category,
  Coupon,
  NewsletterSubscriber,
  Order,
  Pagination,
  Product,
  SavedAddress,
  ShippingOption,
  User,
} from "@/types";

export async function login(email: string, password: string) {
  const { data } = await api.post<ApiResponse<{ user: User; token: string }>>("/auth/login", {
    email,
    password,
  });
  return data;
}

export async function register(name: string, email: string, password: string) {
  const { data } = await api.post<ApiResponse<{ user: User; token: string }>>("/auth/register", {
    name,
    email,
    password,
  });
  return data;
}

export async function getMe() {
  const { data } = await api.get<ApiResponse<User>>("/auth/me");
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post<ApiResponse<{ message: string }>>("/auth/forgot-password", {
    email,
  });
  return data;
}

export async function resetPassword(token: string, password: string) {
  const { data } = await api.post<ApiResponse<{ message: string }>>("/auth/reset-password", {
    token,
    password,
  });
  return data;
}

export async function getProducts(params?: Record<string, string | number | undefined>) {
  const { data } = await api.get<
    ApiResponse<{ products: Product[]; pagination: Pagination }>
  >("/products", { params });
  return data;
}

export async function getProduct(slug: string) {
  const { data } = await api.get<ApiResponse<{ product: Product; related: Product[] }>>(
    `/products/${slug}`
  );
  return data;
}

export async function getAdminProducts(page = 1) {
  const { data } = await api.get<
    ApiResponse<{ products: Product[]; pagination: Pagination }>
  >("/products/admin/all", { params: { page } });
  return data;
}

export async function createProduct(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<Product>>("/products", payload);
  return data;
}

export async function updateProduct(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiResponse<Product>>(`/products/${id}`, payload);
  return data;
}

export async function deleteProduct(id: string) {
  const { data } = await api.delete<
    ApiResponse<{ message: string; archived?: boolean }>
  >(`/products/${id}`);
  return data;
}

export async function getCategories() {
  const { data } = await api.get<ApiResponse<Category[]>>("/categories");
  return data;
}

export async function createCategory(payload: { name: string; image?: string | null }) {
  const { data } = await api.post<ApiResponse<Category>>("/categories", payload);
  return data;
}

export async function updateCategory(
  id: string,
  payload: { name?: string; image?: string | null }
) {
  const { data } = await api.put<ApiResponse<Category>>(`/categories/${id}`, payload);
  return data;
}

export async function deleteCategory(id: string) {
  const { data } = await api.delete<ApiResponse<{ message: string }>>(`/categories/${id}`);
  return data;
}

export async function getAddresses() {
  const { data } = await api.get<ApiResponse<SavedAddress[]>>("/addresses");
  return data;
}

export async function createAddress(payload: {
  label?: string | null;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  isDefault?: boolean;
}) {
  const { data } = await api.post<ApiResponse<SavedAddress>>("/addresses", payload);
  return data;
}

export async function updateAddress(
  id: string,
  payload: {
    label?: string | null;
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    isDefault?: boolean;
  }
) {
  const { data } = await api.put<ApiResponse<SavedAddress>>(`/addresses/${id}`, payload);
  return data;
}

export async function setDefaultAddress(id: string) {
  const { data } = await api.patch<ApiResponse<SavedAddress>>(`/addresses/${id}/default`);
  return data;
}

export async function deleteAddress(id: string) {
  const { data } = await api.delete<ApiResponse<{ message: string }>>(`/addresses/${id}`);
  return data;
}

export async function getShippingOptions() {
  const { data } = await api.get<
    ApiResponse<{ currency: string; options: ShippingOption[] }>
  >("/shipping");
  return data;
}

export async function getAdminShippingOptions() {
  const { data } = await api.get<ApiResponse<ShippingOption[]>>("/shipping/admin/all");
  return data;
}

export async function createShippingOption(payload: {
  name: string;
  description?: string;
  price: number;
  active?: boolean;
  sortOrder?: number;
}) {
  const { data } = await api.post<ApiResponse<ShippingOption>>("/shipping", payload);
  return data;
}

export async function updateShippingOption(
  id: string,
  payload: {
    name?: string;
    description?: string;
    price?: number;
    active?: boolean;
    sortOrder?: number;
  }
) {
  const { data } = await api.put<ApiResponse<ShippingOption>>(`/shipping/${id}`, payload);
  return data;
}

export async function deleteShippingOption(id: string) {
  const { data } = await api.delete<ApiResponse<{ message: string }>>(`/shipping/${id}`);
  return data;
}

export async function createOrder(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<Order>>("/orders", payload);
  return data;
}

export async function getMyOrders() {
  const { data } = await api.get<ApiResponse<Order[]>>("/orders/my");
  return data;
}

export async function getAdminOrders(page = 1, status?: string) {
  const { data } = await api.get<ApiResponse<{ orders: Order[]; pagination: Pagination }>>(
    "/orders",
    { params: { page, status } }
  );
  return data;
}

export async function updateOrderStatus(id: string, status: string) {
  const { data } = await api.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status });
  return data;
}

export async function initPayment(provider: "flutterwave" | "korapay", orderId: string) {
  const { data } = await api.post<
    ApiResponse<{ authorizationUrl: string; reference: string }>
  >(`/payments/${provider}`, { orderId });
  return data;
}

export async function verifyPayment(
  provider: string,
  reference: string,
  transactionId?: string
) {
  const { data } = await api.get<ApiResponse<{ paid: boolean; order?: Order }>>(
    `/payments/verify/${provider}/${encodeURIComponent(reference)}`,
    {
      params: transactionId ? { transaction_id: transactionId } : undefined,
    }
  );
  return data;
}

export async function validateCoupon(code: string) {
  const { data } = await api.post<ApiResponse<{ code: string; percentage: number }>>(
    "/coupons/validate",
    { code }
  );
  return data;
}

export async function getCoupons() {
  const { data } = await api.get<ApiResponse<Coupon[]>>("/coupons");
  return data;
}

export async function createCoupon(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<Coupon>>("/coupons", payload);
  return data;
}

export async function deleteCoupon(id: string) {
  const { data } = await api.delete<ApiResponse<{ message: string }>>(`/coupons/${id}`);
  return data;
}

export async function subscribeNewsletter(email: string) {
  const { data } = await api.post<ApiResponse<{ message: string }>>("/newsletter/subscribe", {
    email,
  });
  return data;
}

export async function getSubscribers() {
  const { data } = await api.get<ApiResponse<NewsletterSubscriber[]>>("/newsletter");
  return data;
}

export async function updateProfile(payload: { name?: string; email?: string }) {
  const { data } = await api.put<ApiResponse<User>>("/users/profile", payload);
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const { data } = await api.put<ApiResponse<{ message: string }>>("/users/password", {
    currentPassword,
    newPassword,
  });
  return data;
}

export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await api.post<ApiResponse<{ url: string; filename: string }>>(
    "/upload",
    formData
  );
  return data;
}

export async function getCart() {
  const { data } = await api.get<ApiResponse<{ items: CartItem[] }>>("/cart");
  return data;
}

export async function syncCart(
  items: { productId: string; variantId?: string | null; quantity: number }[]
) {
  const { data } = await api.put<ApiResponse<{ items: CartItem[] }>>("/cart", { items });
  return data;
}

export async function clearServerCart() {
  const { data } = await api.delete<ApiResponse<{ items: [] }>>("/cart");
  return data;
}
