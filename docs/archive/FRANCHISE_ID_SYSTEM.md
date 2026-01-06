# 🏢 FRANCHISE ID SYSTEM - COMPLETE ISOLATION

## 🎯 Problem Statement

**Current Issues:**
1. ❌ Admin showing in franchise manager's view
2. ❌ Employees from other franchises visible
3. ❌ No unique franchise-based IDs
4. ❌ Cannot track which franchise created orders
5. ❌ Cannot generate franchise-wise reports
6. ❌ Isolation broken at database level

**Root Cause:** No standardized ID system linking entities to franchises

---

## 📋 Proposed ID Structure

### **Franchise IDs**
```
Format: FZC[NN]
Examples:
- FZC01 = Pollachi
- FZC02 = Kinathukadavu  
- FZC03 = Coimbatore
```

### **Employee IDs**
```
Format: [FRANCHISE_ID][ROLE][NN]

Roles:
- MG = Manager
- EM = Employee/Staff
- DR = Driver
- CS = Counter Staff

Examples:
- FZC01MG01 = Pollachi Manager #1
- FZC01EM01 = Pollachi Employee #1
- FZC01DR01 = Pollachi Driver #1
- FZC02MG01 = Kinathukadavu Manager #1
```

### **Order IDs**
```
Format: [FRANCHISE_ID][EMPLOYEE_ID]OR[NNNN]

Examples:
- FZC01MG01OR0001 = Order #1 created by Pollachi Manager
- FZC01EM01OR0002 = Order #2 created by Pollachi Employee
- FZC02MG01OR0001 = Order #1 created by Kinathukadavu Manager

Benefits:
✅ Know which franchise
✅ Know which employee created it
✅ Sequential order numbering per employee
✅ Easy reporting and analytics
```

### **Customer IDs**
```
Format: [FRANCHISE_ID]CU[NNNN]

Examples:
- FZC01CU0001 = Pollachi Customer #1
- FZC02CU0001 = Kinathukadavu Customer #1

Benefits:
✅ Track customers per franchise
✅ Franchise-specific customer analytics
```

### **Service IDs**
```
Format: [FRANCHISE_ID]SV[NNNN]

Examples:
- FZC01SV0001 = Pollachi Service #1
- FZC02SV0001 = Kinathukadavu Service #1
```

---

## 🗄️ Database Schema Changes

### **1. Franchises Table**
```sql
ALTER TABLE franchises
ADD COLUMN franchise_code VARCHAR(10) UNIQUE NOT NULL;

-- Update existing
UPDATE franchises SET franchise_code = 'FZC01' WHERE name = 'Pollachi';
UPDATE franchises SET franchise_code = 'FZC02' WHERE name = 'Kinathukadavu';

-- Add index
CREATE INDEX idx_franchises_code ON franchises(franchise_code);
```

### **2. Employees Table**
```sql
-- employee_id is already VARCHAR, just need to update values
-- Add constraint to ensure format
ALTER TABLE employees
ADD CONSTRAINT chk_employee_id_format 
CHECK (employee_id ~ '^FZC[0-9]{2}(MG|EM|DR|CS)[0-9]{2}$');

-- Update existing employees
UPDATE employees 
SET employee_id = 'FZC01MG01' 
WHERE employee_id = 'mgr-pol';

UPDATE employees 
SET employee_id = 'FZC01DR01' 
WHERE employee_id = 'drv-pol';

UPDATE employees 
SET employee_id = 'FZC01CS01' 
WHERE employee_id = 'staff-pol';

UPDATE employees 
SET employee_id = 'FZC02MG01' 
WHERE employee_id = 'mgr-kin';

-- Admin stays as 'ADMIN' (no franchise)
```

### **3. Orders Table**
```sql
ALTER TABLE orders
ADD COLUMN order_code VARCHAR(30) UNIQUE;

-- Add function to generate order codes
CREATE OR REPLACE FUNCTION generate_order_code(
    p_franchise_id VARCHAR,
    p_employee_id VARCHAR
) RETURNS VARCHAR AS $$
DECLARE
    v_franchise_code VARCHAR(10);
    v_next_number INT;
    v_order_code VARCHAR(30);
BEGIN
    -- Get franchise code
    SELECT franchise_code INTO v_franchise_code
    FROM franchises WHERE id = p_franchise_id;
    
    -- Get next order number for this employee
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(order_code FROM '.{12}OR(.{4})$') AS INT)
    ), 0) + 1
    INTO v_next_number
    FROM orders
    WHERE order_code LIKE v_franchise_code || p_employee_id || 'OR%';
    
    -- Generate code
    v_order_code := v_franchise_code || p_employee_id || 'OR' || 
                    LPAD(v_next_number::TEXT, 4, '0');
    
    RETURN v_order_code;
END;
$$ LANGUAGE plpgsql;
```

### **4. Customers Table**
```sql
ALTER TABLE customers
ADD COLUMN customer_code VARCHAR(20) UNIQUE;

-- Add function to generate customer codes
CREATE OR REPLACE FUNCTION generate_customer_code(
    p_franchise_id VARCHAR
) RETURNS VARCHAR AS $$
DECLARE
    v_franchise_code VARCHAR(10);
    v_next_number INT;
    v_customer_code VARCHAR(20);
BEGIN
    -- Get franchise code
    SELECT franchise_code INTO v_franchise_code
    FROM franchises WHERE id = p_franchise_id;
    
    -- Get next customer number
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(customer_code FROM 'CU(.{4})$') AS INT)
    ), 0) + 1
    INTO v_next_number
    FROM customers
    WHERE customer_code LIKE v_franchise_code || 'CU%';
    
    -- Generate code
    v_customer_code := v_franchise_code || 'CU' || 
                       LPAD(v_next_number::TEXT, 4, '0');
    
    RETURN v_customer_code;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔒 Isolation Implementation

### **1. Employee Isolation**
```sql
-- View for franchise employees (excludes admin)
CREATE OR REPLACE VIEW franchise_employees AS
SELECT e.*
FROM employees e
WHERE e.role != 'admin'
AND e.franchise_id IS NOT NULL;

-- Function to get employees by franchise
CREATE OR REPLACE FUNCTION get_franchise_employees(p_franchise_id VARCHAR)
RETURNS TABLE (
    id UUID,
    employee_id VARCHAR,
    full_name VARCHAR,
    role VARCHAR,
    position VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.employee_id,
        e.first_name || ' ' || e.last_name AS full_name,
        e.role,
        e.position
    FROM employees e
    WHERE e.franchise_id = p_franchise_id
    AND e.role != 'admin'
    AND e.is_active = true
    ORDER BY e.employee_id;
END;
$$ LANGUAGE plpgsql;
```

### **2. Order Isolation**
```sql
-- View for franchise orders
CREATE OR REPLACE VIEW franchise_orders AS
SELECT 
    o.*,
    o.order_code,
    SUBSTRING(o.order_code FROM 1 FOR 5) AS franchise_code,
    SUBSTRING(o.order_code FROM 1 FOR 12) AS employee_code
FROM orders o
WHERE o.order_code IS NOT NULL;

-- Function to get orders by franchise
CREATE OR REPLACE FUNCTION get_franchise_orders(p_franchise_code VARCHAR)
RETURNS TABLE (
    id UUID,
    order_code VARCHAR,
    customer_name VARCHAR,
    total_amount DECIMAL,
    status VARCHAR,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.order_code,
        c.name AS customer_name,
        o.total_amount,
        o.status,
        o.created_at
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.order_code LIKE p_franchise_code || '%'
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql;
```

### **3. RLS Policies**
```sql
-- Enable RLS on employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Policy: Admins see all
CREATE POLICY admin_see_all_employees ON employees
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM employees e
        WHERE e.id = auth.uid()
        AND e.role = 'admin'
    )
);

-- Policy: Managers see only their franchise
CREATE POLICY manager_see_franchise_employees ON employees
FOR SELECT
TO authenticated
USING (
    franchise_id = (
        SELECT franchise_id FROM employees
        WHERE id = auth.uid()
    )
    AND role != 'admin'
);

-- Enable RLS on orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: See only franchise orders
CREATE POLICY franchise_orders_isolation ON orders
FOR ALL
TO authenticated
USING (
    order_code LIKE (
        SELECT franchise_code || '%'
        FROM franchises f
        JOIN employees e ON e.franchise_id = f.id
        WHERE e.id = auth.uid()
    )
);
```

---

## 📊 Reporting Queries

### **Franchise Performance**
```sql
SELECT 
    f.franchise_code,
    f.name AS franchise_name,
    COUNT(DISTINCT o.id) AS total_orders,
    SUM(o.total_amount) AS total_revenue,
    COUNT(DISTINCT o.customer_id) AS unique_customers,
    COUNT(DISTINCT e.id) AS total_employees
FROM franchises f
LEFT JOIN orders o ON o.order_code LIKE f.franchise_code || '%'
LEFT JOIN employees e ON e.franchise_id = f.id AND e.role != 'admin'
GROUP BY f.franchise_code, f.name
ORDER BY total_revenue DESC;
```

### **Employee Performance**
```sql
SELECT 
    e.employee_id,
    e.first_name || ' ' || e.last_name AS employee_name,
    e.position,
    COUNT(o.id) AS orders_created,
    SUM(o.total_amount) AS revenue_generated
FROM employees e
LEFT JOIN orders o ON o.order_code LIKE '%' || e.employee_id || 'OR%'
WHERE e.role != 'admin'
GROUP BY e.employee_id, e.first_name, e.last_name, e.position
ORDER BY revenue_generated DESC;
```

---

## 🚀 Implementation Steps

### **Phase 1: Database Migration**
1. Run franchise code updates
2. Run employee ID updates
3. Add order/customer code columns
4. Create helper functions

### **Phase 2: Backend Updates**
1. Update employee creation to generate IDs
2. Update order creation to generate codes
3. Update customer creation to generate codes
4. Add franchise isolation middleware

### **Phase 3: Frontend Updates**
1. Display new ID formats
2. Update employee lists to filter by franchise
3. Add franchise-wise reports
4. Update order displays

### **Phase 4: Testing**
1. Test employee isolation
2. Test order creation
3. Test reporting
4. Verify admin access

---

## ✅ Expected Results

**After Implementation:**
- ✅ Admin NOT visible to franchise managers
- ✅ Managers see only their franchise employees
- ✅ Orders have traceable IDs
- ✅ Easy franchise-wise reporting
- ✅ Complete database-level isolation
- ✅ Scalable ID system

**ID Examples:**
```
Pollachi:
- Franchise: FZC01
- Manager: FZC01MG01
- Employee: FZC01EM01
- Driver: FZC01DR01
- Order: FZC01MG01OR0001
- Customer: FZC01CU0001

Kinathukadavu:
- Franchise: FZC02
- Manager: FZC02MG01
- Employee: FZC02EM01
- Driver: FZC02DR01
- Order: FZC02MG01OR0001
- Customer: FZC02CU0001
```

---

## 📝 Next Steps

1. Review this proposal
2. Approve ID format
3. Run database migration
4. Update backend code
5. Update frontend code
6. Test thoroughly
7. Deploy

**Estimated Time:** 4-6 hours for complete implementation
