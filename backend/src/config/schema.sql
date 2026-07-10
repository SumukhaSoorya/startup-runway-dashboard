CREATE DATABASE IF NOT EXISTS runway_pulse_db;
USE runway_pulse_db;

-- Table 1: Primary Enterprise Core Financial Metrics
CREATE TABLE IF NOT EXISTS company_financials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    current_cash DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    monthly_revenue DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    burn_engineering DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    burn_marketing DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    burn_operations DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table 2: Relational Episodic Cash-Inflow Milestones
CREATE TABLE IF NOT EXISTS funding_milestones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    month_index INT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES company_financials(id) ON DELETE CASCADE
);

-- Seed Initial Mock Startup Workspace Data securely
INSERT INTO company_financials (id, company_name, currency, current_cash, monthly_revenue, burn_engineering, burn_marketing, burn_operations)
VALUES (1, 'Acme Tech Inc.', 'USD', 350000.00, 20000.00, 35000.00, 15000.00, 12000.00)
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO funding_milestones (company_id, name, amount, month_index)
VALUES 
(1, 'Seed Round Funding', 250000.00, 3),
(1, 'Govt Tech Grant', 75000.00, 6);