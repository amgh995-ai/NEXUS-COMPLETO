const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4001/api";

function buildHeaders(token, hasBody) {
  const headers = {};
  if (hasBody) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function request(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: buildHeaders(token, body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || data.message || "Error en la petición");
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  login: (email, password) =>
    request("/login", { method: "POST", body: { email, password } }),
  getMe: (token) => request("/me", { token }),

  getProducts: (token) => request("/products", { token }),
  createProduct: (token, payload) =>
    request("/products", { method: "POST", token, body: payload }),
  updateProduct: (token, id, payload) =>
    request(`/products/${id}`, { method: "PUT", token, body: payload }),
  deleteProduct: (token, id) =>
    request(`/products/${id}`, { method: "DELETE", token }),
  addStock: (token, id, quantity) =>
    request(`/products/${id}/add-stock`, { method: "PUT", token, body: { quantity } }),

  getBranches: (token) => request("/branches", { token }),
  createBranch: (token, payload) =>
    request("/branches", { method: "POST", token, body: payload }),

  getUsers: (token) => request("/users", { token }),
  createUser: (token, payload) =>
    request("/users", { method: "POST", token, body: payload }),
  updateUserRole: (token, id, newRole) =>
    request(`/users/${id}`, { method: "PUT", token, body: { role: newRole } }),
  updateUserBranch: (token, id, branchId) =>
    request(`/users/${id}/branch`, { method: "PUT", token, body: { branch_id: branchId } }),
  deleteUser: (token, id) =>
    request(`/users/${id}`, { method: "DELETE", token }),

  getSales: (token) => request("/sales", { token }),
  createSale: (token, payload) =>
    request("/sales", { method: "POST", token, body: payload }),

  getColdRoom: (token) => request("/cold-room", { token }),
  registerProduction: (token, payload) =>
    request("/cold-room/production", { method: "POST", token, body: payload }),

  getOvenHistory: (token) => request("/oven", { token }),
  bakeOven: (token, payload) =>
    request("/oven/bake", { method: "POST", token, body: payload }),

  getPlantStock: (token) => request("/dispatch/plant-stock", { token }),
  getDispatchHistory: (token) => request("/dispatch", { token }),
  createDispatch: (token, payload) =>
    request("/dispatch", { method: "POST", token, body: payload }),

  getInventoryMovements: (token) => request("/inventory-movements", { token }),

  getDailyReport: (token, date) =>
    request(`/daily-report${date ? `?date=${date}` : ""}`, { token }),
};

