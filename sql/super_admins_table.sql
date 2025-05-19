CREATE TABLE IF NOT EXISTS SuperAdmins (
  super_admin_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  is_verified TINYINT(1) DEFAULT 0,
  verification_token VARCHAR(255),
  token_expiry TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (super_admin_id)
); 