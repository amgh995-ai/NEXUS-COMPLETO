const PERMISSIONS = {
  MANAGE_PRODUCTS: "manage_products",
  MANAGE_USERS: "manage_users",
  MANAGE_INVENTORY: "manage_inventory",
  VIEW_DASHBOARD: "view_dashboard",
  CREATE_SALES: "create_sales",
  VIEW_SALES: "view_sales",
  PRODUCE: "produce",
  DISPATCH: "dispatch",

  // 🔥 NUEVOS
  USERS_VIEW: "users_view",
  USERS_CREATE: "users_create",
  USERS_EDIT: "users_edit",
  USERS_DELETE: "users_delete",

  PRODUCTS_VIEW: "products_view",
  PRODUCTS_CREATE: "products_create",
  PRODUCTS_EDIT: "products_edit",
  PRODUCTS_DELETE: "products_delete",

  INVENTORY_VIEW: "inventory_view",
  INVENTORY_EDIT: "inventory_edit",
};

module.exports = PERMISSIONS;