-- 1. Create a sequence for Employee ID generation
-- Format: FZC + YY + EMP + 000 (e.g., FZC26EMP001)
DO $$
DECLARE
    max_seq INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id, 9) AS INTEGER)), 0) INTO max_seq 
    FROM employees 
    WHERE employee_id LIKE 'FZC__EMP%';
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'employee_id_seq') THEN
        EXECUTE 'CREATE SEQUENCE employee_id_seq START WITH ' || (max_seq + 1);
    ELSE
        EXECUTE 'SELECT setval(''employee_id_seq'', ' || GREATEST(nextval('employee_id_seq'), max_seq + 1) || ', false)';
    END IF;
END $$;

-- 2. Function to get next Employee ID
CREATE OR REPLACE FUNCTION get_next_employee_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    next_val INTEGER;
    v_year TEXT;
BEGIN
    next_val := nextval('employee_id_seq');
    v_year := to_char(now(), 'YY');
    RETURN 'FZC' || v_year || 'EMP' || LPAD(next_val::TEXT, 3, '0');
END;
$$;

-- 3. Optimized Employee Bulk Import RPC
CREATE OR REPLACE FUNCTION import_employees_bulk(p_employees JSONB)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_employee RECORD;
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    v_skipped_emails TEXT[] := ARRAY[]::TEXT[];
BEGIN
    FOR v_employee IN SELECT * FROM jsonb_array_elements(p_employees)
    LOOP
        BEGIN
            -- Check for existing email to avoid duplicates
            IF EXISTS (SELECT 1 FROM employees WHERE email = v_employee.value->>'email') THEN
                v_skipped_emails := array_append(v_skipped_emails, v_employee.value->>'email');
                CONTINUE;
            END IF;

            -- Insert employee
            INSERT INTO employees (
                id, 
                employee_id,
                first_name, 
                last_name, 
                email, 
                phone, 
                position,
                department,
                hire_date,
                salary,
                status,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(), -- Keep UUID as primary key but EMPxxx as employee_id
                COALESCE(v_employee.value->>'employeeId', get_next_employee_id()),
                v_employee.value->>'firstName',
                v_employee.value->>'lastName',
                v_employee.value->>'email',
                v_employee.value->>'phone',
                COALESCE(v_employee.value->>'position', 'Staff'),
                COALESCE(v_employee.value->>'department', 'Staff & Faculty'),
                COALESCE((v_employee.value->>'hireDate')::timestamp, NOW()),
                COALESCE((v_employee.value->>'salary')::numeric, 0),
                'active',
                NOW(),
                NOW()
            );
            
            v_count := v_count + 1;
        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'inserted_count', v_count,
        'error_count', v_errors,
        'skipped_emails', v_skipped_emails
    );
END;
$$;
