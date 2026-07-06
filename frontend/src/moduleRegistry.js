// Catálogo único de módulos del sistema. Cada entrada define:
// - el permiso requerido para ver el botón en el dashboard
// - el ícono/etiqueta del botón
// - el componente que se renderiza al seleccionarlo
//
// Agregar un módulo nuevo = agregar una entrada aquí. No hay que tocar
// el Dashboard ni el Sidebar: ambos se generan a partir de esta lista.

import Products from "./modules/Products";
import Branches from "./modules/Branches";
import Users from "./modules/Users";
import ColdRoom from "./modules/ColdRoom";
import Oven from "./modules/Oven";
import Dispatch from "./modules/Dispatch";
import Cart from "./modules/Cart";
import SalesHistory from "./modules/SalesHistory";
import InventoryMovements from "./modules/InventoryMovements";

export const MODULES = [
  {
    key: "products",
    label: "Productos",
    icon: "🍞",
    permission: "products_view",
    component: Products,
  },
  {
    key: "cold_room",
    label: "Cuarto Frío",
    icon: "❄️",
    permission: "produce",
    component: ColdRoom,
  },
  {
    key: "oven",
    label: "Horneo",
    icon: "🔥",
    permission: "produce",
    component: Oven,
  },
  {
    key: "dispatch",
    label: "Despacho",
    icon: "🚚",
    permission: "dispatch",
    component: Dispatch,
  },
  {
    key: "sales",
    label: "Ventas",
    icon: "🛒",
    permission: "create_sales",
    component: Cart,
  },
  {
    key: "sales_history",
    label: "Historial de ventas",
    icon: "🧾",
    permission: "view_sales",
    component: SalesHistory,
  },
  {
    key: "movements",
    label: "Reporte de movimientos",
    icon: "📋",
    permission: "inventory_view",
    component: InventoryMovements,
  },
  {
    key: "branches",
    label: "Sedes",
    icon: "🏢",
    // Sedes: todos los autenticados pueden ver la lista; solo
    // quien tenga permiso de usuarios puede crear (lo filtra el propio
    // componente vía la prop canCreate).
    permission: null,
    component: Branches,
  },
  {
    key: "users",
    label: "Usuarios",
    icon: "👥",
    permission: "users_view",
    component: Users,
  },
];

export function getVisibleModules(permissions) {
  return MODULES.filter(
    (m) => m.permission === null || permissions.includes(m.permission)
  );
}
