import { useCallback, useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";

import Login from "./Login";
import { api } from "./api";
import { styles } from "./styles";
import { useAuth } from "./hooks/useAuth";
import Dashboard from "./components/Dashboard";
import { MODULES } from "./moduleRegistry";

function App() {
  const { token, role, permissions, login, logout } = useAuth();

  const [activeModule, setActiveModule] = useState(null);

  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [sales, setSales] = useState([]);
  const [cart, setCart] = useState([]);

  const [coldRoom, setColdRoom] = useState([]);
  const [ovenHistory, setOvenHistory] = useState([]);
  const [plantStock, setPlantStock] = useState([]);
  const [dispatchHistory, setDispatchHistory] = useState([]);
  const [movements, setMovements] = useState([]);

  const loadProducts = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.getProducts(token);
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      alert(error.message);
    }
  }, [token]);

  const loadBranches = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.getBranches(token);
      setBranches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando sedes:", error);
    }
  }, [token]);

  const loadUsers = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.getUsers(token);
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    }
  }, [token]);

  const loadSales = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.getSales(token);
      setSales(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando ventas:", error);
    }
  }, [token]);

  const loadColdRoom = useCallback(async () => {
    if (!token || !permissions.includes("produce")) return;
    try {
      const data = await api.getColdRoom(token);
      setColdRoom(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando cuarto frío:", error);
    }
  }, [token, permissions]);

  const loadOvenHistory = useCallback(async () => {
    if (!token || !permissions.includes("produce")) return;
    try {
      const data = await api.getOvenHistory(token);
      setOvenHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando historial de horneo:", error);
    }
  }, [token, permissions]);

  const loadPlantStock = useCallback(async () => {
    if (!token || !permissions.includes("dispatch")) return;
    try {
      const data = await api.getPlantStock(token);
      setPlantStock(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando stock de planta:", error);
    }
  }, [token, permissions]);

  const loadDispatchHistory = useCallback(async () => {
    if (!token || !permissions.includes("dispatch")) return;
    try {
      const data = await api.getDispatchHistory(token);
      setDispatchHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando historial de despacho:", error);
    }
  }, [token, permissions]);

  const loadMovements = useCallback(async () => {
    if (!token || !permissions.includes("inventory_view")) return;
    try {
      const data = await api.getInventoryMovements(token);
      setMovements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando movimientos:", error);
    }
  }, [token, permissions]);

  const refreshInventoryData = useCallback(async () => {
    await Promise.all([
      loadProducts(),
      loadColdRoom(),
      loadPlantStock(),
      loadMovements(),
    ]);
  }, [loadProducts, loadColdRoom, loadPlantStock, loadMovements]);

  // Carga inicial: todo lo que cualquier rol podría necesitar.
  // Es la misma estrategia "cargar todo una vez, mostrar según permiso"
  // del proyecto original; aquí además decide qué *botones* mostrar.
  useEffect(() => {
    if (!token) return;
    loadProducts();
    loadBranches();
    loadSales();
  }, [token, loadProducts, loadBranches, loadSales]);

  useEffect(() => {
    if (token && permissions.includes("users_view")) loadUsers();
  }, [token, permissions, loadUsers]);

  useEffect(() => {
    if (!token) return;
    loadColdRoom();
    loadOvenHistory();
    loadPlantStock();
    loadDispatchHistory();
    loadMovements();
  }, [
    token,
    permissions,
    loadColdRoom,
    loadOvenHistory,
    loadPlantStock,
    loadDispatchHistory,
    loadMovements,
  ]);

  // CARRITO
  const addToCart = (product) => {
    if (!product || (product.stock || 0) <= 0) return alert("Sin stock ❌");

    setCart((prev) => {
      const existing = prev.find((p) => p.id === product.id);

      if (existing) {
        if (existing.quantity >= product.stock) {
          alert("Stock insuficiente ❌");
          return prev;
        }
        return prev.map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          quantity: 1,
          stock: Number(product.stock),
        },
      ];
    });
  };

  const decreaseQuantity = (product) => {
    setCart((prev) =>
      prev
        .map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity - 1 } : p
        )
        .filter((p) => p.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Carrito vacío");

    try {
      await api.createSale(token, { items: cart });
      setCart([]);
      await loadSales();
      await refreshInventoryData();
      alert("Venta guardada 💰");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleCreateBranch = async (payload) => {
    try {
      await api.createBranch(token, payload);
      await loadBranches();
      alert("Sede creada correctamente ✅");
    } catch (error) {
      alert(error.message);
    }
  };

  // Construye las props específicas que necesita cada módulo.
  // Vive aquí (y no en moduleRegistry) porque depende del estado vivo
  // de App.js; moduleRegistry solo sabe "qué componente y qué permiso".
  function getModuleProps(key) {
    switch (key) {
      case "products":
        return {
          token,
          products,
          permissions,
          onChanged: refreshInventoryData,
          onAddToCart: addToCart,
          styles,
        };
      case "cold_room":
        return {
          token,
          products,
          coldRoom,
          permissions,
          onChanged: refreshInventoryData,
          styles,
        };
      case "oven":
        return {
          token,
          coldRoom,
          ovenHistory,
          permissions,
          onChanged: async () => {
            await refreshInventoryData();
            await loadOvenHistory();
          },
          styles,
        };
      case "dispatch":
        return {
          token,
          plantStock,
          dispatchHistory,
          branches,
          permissions,
          onChanged: async () => {
            await refreshInventoryData();
            await loadDispatchHistory();
          },
          styles,
        };
      case "sales":
        return {
          cart,
          permissions,
          onIncrease: addToCart,
          onDecrease: decreaseQuantity,
          onRemove: removeFromCart,
          onCheckout: handleCheckout,
          styles,
        };
      case "sales_history":
        return { sales, permissions, styles };
      case "movements":
        return { movements, permissions, styles };
      case "branches":
        return {
          branches,
          canCreate:
            role === "admin" || permissions.includes("users_create"),
          onCreate: handleCreateBranch,
          styles,
        };
      case "users":
        return {
          token,
          users,
          branches,
          permissions,
          onChanged: loadUsers,
          styles,
        };
      default:
        return {};
    }
  }

  if (!token) {
    return <Login onLogin={login} />;
  }

  const activeDef = MODULES.find((m) => m.key === activeModule);
  const ActiveComponent = activeDef?.component;

  return (
    <>
      <div style={styles.page}>
        <div style={styles.topbar}>
          <div>
            <h2 style={styles.topbarTitle}>Nexus 🚀</h2>
            <span style={styles.topbarUser}>Rol: {role}</span>
          </div>

          <button style={styles.logoutButton} onClick={logout}>
            Cerrar sesión
          </button>
        </div>

        <div style={styles.moduleContent}>
          {activeDef ? (
            <>
              <button
                style={styles.backButton}
                onClick={() => setActiveModule(null)}
              >
                ← Volver al menú
              </button>

              <ActiveComponent {...getModuleProps(activeDef.key)} />
            </>
          ) : null}
        </div>

        {!activeDef && (
          <Dashboard
            permissions={permissions}
            onSelect={setActiveModule}
            styles={styles}
          />
        )}
      </div>
      <Analytics />
    </>
  );
}

export default App;
