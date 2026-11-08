-- ============================================================================
-- RunwayPulse Relational Multi-Tenant Database Schema (MySQL 5.7 / 8.0+)
-- Dialect: MySQL
-- ============================================================================

CREATE DATABASE IF NOT EXISTS runway_pulse_db;
USE runway_pulse_db;

-- 1. Multi-Tenant Authenticated Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Core Enterprise Company Financial Metrics
CREATE TABLE IF NOT EXISTS company_financials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    current_cash DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    monthly_revenue DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    burn_engineering DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    burn_marketing DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    burn_operations DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_financials_user (user_id),
    CONSTRAINT fk_financials_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 3. Relational Episodic Cash-Inflow Milestones
CREATE TABLE IF NOT EXISTS funding_milestones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT DEFAULT NULL,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    month_index INT NOT NULL,
    INDEX idx_milestones_user (user_id),
    INDEX idx_milestones_company (company_id),
    CONSTRAINT fk_milestones_company FOREIGN KEY (company_id) REFERENCES company_financials (id) ON DELETE CASCADE,
    CONSTRAINT fk_milestones_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 4. Initial Institutional Baseline Seed Data (ANSI / MySQL Compatible)
INSERT INTO users (id, email, password)
SELECT 1, 'admin@enterprise.com', 'admin123'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 1);

INSERT INTO company_financials (id, user_id, company_name, currency, current_cash, monthly_revenue, burn_engineering, burn_marketing, burn_operations)
SELECT 1, 1, 'RunwayPulse AI Tech Inc.', 'USD', 350000.00, 20000.00, 35000.00, 15000.00, 12000.00
WHERE NOT EXISTS (SELECT 1 FROM company_financials WHERE id = 1);

INSERT INTO funding_milestones (id, company_id, user_id, name, amount, month_index)
SELECT 1, 1, 1, 'Seed Round Funding', 250000.00, 3
WHERE NOT EXISTS (SELECT 1 FROM funding_milestones WHERE id = 1);

INSERT INTO funding_milestones (id, company_id, user_id, name, amount, month_index)
SELECT 2, 1, 1, 'Govt Tech Grant', 75000.00, 6
WHERE NOT EXISTS (SELECT 1 FROM funding_milestones WHERE id = 2);
