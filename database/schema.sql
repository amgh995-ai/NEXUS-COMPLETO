-- ============================================================
-- Nexus — Schema completo
-- Compatible con MySQL 8.x (Railway)
-- Ejecutar una sola vez sobre la base de datos vacía de Nexus.
-- Esta base es completamente independiente de Control 360.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('admin','vendedor','hornero','despacho','jefe_produccion')
             NOT NULL DEFAULT 'vendedor',
  branch_id  INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SEDES
CREATE TABLE IF NOT EXISTS branches (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL UNIQUE,
  address    VARCHAR(255) NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sede virtual para la planta central de producción.
INSERT INTO branches (name, address)
VALUES ('Planta Central', 'Cocina central de producción')
ON DUPLICATE KEY UPDATE name = name;

-- PRODUCTOS
CREATE TABLE IF NOT EXISTS products (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  price      DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INVENTARIO POR SEDE
-- La clave única es obligatoria para los upserts de Horneo y Despacho.
CREATE TABLE IF NOT EXISTS branch_inventory (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  branch_id  INT NOT NULL,
  product_id INT NOT NULL,
  stock      INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_branch_inventory (branch_id, product_id),
  CONSTRAINT fk_bi_branch
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  CONSTRAINT fk_bi_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- CUARTO FRÍO
CREATE TABLE IF NOT EXISTS cold_room (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  quantity   INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cold_room_product (product_id),
  CONSTRAINT fk_cr_product
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- HORNEO
CREATE TABLE IF NOT EXISTS oven (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  quantity   INT NOT NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_oven_product
    FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_oven_user
    FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- DESPACHO
CREATE TABLE IF NOT EXISTS dispatch (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  product_id            INT NOT NULL,
  quantity              INT NOT NULL,
  destination_branch_id INT NOT NULL,
  created_by            INT NULL,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dispatch_product
    FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_dispatch_branch
    FOREIGN KEY (destination_branch_id) REFERENCES branches(id),
  CONSTRAINT fk_dispatch_user
    FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- VENTAS
CREATE TABLE IF NOT EXISTS sales (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  total      DECIMAL(10,2) NOT NULL,
  branch_id  INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sales_branch
    FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS sale_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  sale_id    INT NOT NULL,
  product_id INT NOT NULL,
  quantity   INT NOT NULL,
  price      DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_si_sale
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  CONSTRAINT fk_si_product
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- MOVIMIENTOS DE INVENTARIO
-- Tipos: PRODUCCION · HORNEO · DESPACHO_SALIDA · DESPACHO_ENTRADA
--        VENTA · ENTRADA (ajuste manual)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  branch_id     INT NOT NULL,
  product_id    INT NOT NULL,
  quantity      INT NOT NULL,
  movement_type VARCHAR(50) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_im_branch
    FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_im_product
    FOREIGN KEY (product_id) REFERENCES products(id)
);

SET FOREIGN_KEY_CHECKS = 1;

-- FK de usuarios → branches (al final porque branches ya debe existir)
ALTER TABLE usuarios
  ADD CONSTRAINT fk_usuarios_branch
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;

-- ============================================================
-- USUARIO ADMIN INICIAL
-- Email: admin@nexus.com  |  Contraseña: nexus1234
-- Cámbiala en cuanto entres por primera vez.
-- ============================================================
INSERT INTO usuarios (email, password, role)
VALUES (
  'admin@nexus.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
  'admin'
) ON DUPLICATE KEY UPDATE email = email;
