CREATE TABLE rooms (
  id     CHAR(36)    NOT NULL PRIMARY KEY,
  name   VARCHAR(50) NOT NULL,
  active TINYINT(1)  NOT NULL DEFAULT 1
);

CREATE TABLE foods (
  id          CHAR(36)    NOT NULL PRIMARY KEY,
  name        VARCHAR(80) NOT NULL,
  description VARCHAR(80) NULL,
  active      TINYINT(1)  NOT NULL DEFAULT 1,
  image_url VARCHAR(255) NULL
);

CREATE TABLE orders (
  id         CHAR(36)    NOT NULL PRIMARY KEY,
  room_id    CHAR(36)    NOT NULL,
  customer   VARCHAR(40) NOT NULL,
  status     ENUM('pending', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_room FOREIGN KEY (room_id) REFERENCES rooms(id),
  INDEX idx_orders_status (status)
);

CREATE TABLE order_items (
  id       CHAR(36) NOT NULL PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  food_id  CHAR(36) NOT NULL,
  quantity INT      NOT NULL,
  CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_items_food  FOREIGN KEY (food_id)  REFERENCES foods(id)
);