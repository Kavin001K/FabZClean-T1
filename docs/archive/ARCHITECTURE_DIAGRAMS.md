# FabZClean - Franchise Isolation Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FABZCLEAN SYSTEM                             │
│                    (Multi-Franchise Platform)                        │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
         ┌──────────▼──────────┐     ┌─────────▼──────────┐
         │  Franchise Pollachi │     │ Franchise Kinathuk │
         │   (franchise-pol)   │     │   (franchise-kin)  │
         └──────────┬──────────┘     └─────────┬──────────┘
                    │                           │
         ┌──────────┴──────────┐     ┌─────────┴──────────┐
         │                     │     │                     │
    ┌────▼────┐          ┌────▼────┐│┌────▼────┐    ┌────▼────┐
    │Employees│          │Employees│││Employees│    │Employees│
    │  Admin  │          │ Manager │││ Manager │    │  Staff  │
    │  (1)    │          │  (1)    │││  (1)    │    │  (2)    │
    └────┬────┘          └────┬────┘│└────┬────┘    └────┬────┘
         │                    │     │     │              │
         │                    │     │     │              │
    ┌────▼─────────────────────▼────┐│┌───▼──────────────▼─────┐
    │   Attendance Records          ││   Attendance Records    │
    │   (franchise_id: pol)         ││   (franchise_id: kin)   │
    │   ✓ Isolated                  ││   ✓ Isolated            │
    └────┬──────────────────────────┘│└───┬─────────────────────┘
         │                            │    │
    ┌────▼─────────────────────▼────┐│┌───▼──────────────▼─────┐
    │   Employee Tasks              ││   Employee Tasks        │
    │   (franchise_id: pol)         ││   (franchise_id: kin)   │
    │   ✓ Isolated                  ││   ✓ Isolated            │
    └────┬──────────────────────────┘│└───┬─────────────────────┘
         │                            │    │
    ┌────▼─────────────────────▼────┐│┌───▼──────────────▼─────┐
    │   Audit Logs                  ││   Audit Logs            │
    │   (franchise_id: pol)         ││   (franchise_id: kin)   │
    │   ✓ Isolated                  ││   ✓ Isolated            │
    └───────────────────────────────┘│└─────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │    ISOLATION ENFORCEMENT        │
                    │  ✓ Foreign Key Constraints      │
                    │  ✓ Unique Constraints           │
                    │  ✓ Check Constraints            │
                    │  ✓ Row Level Security (RLS)     │
                    │  ✓ Application-Level Checks     │
                    └─────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER REQUEST                                │
│  (Manager marks attendance for employee)                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION                                 │
│  ✓ Verify JWT Token                                             │
│  ✓ Extract employee_id, franchise_id, role                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AUTHORIZATION                                  │
│  ✓ Check role (admin, manager, employee)                        │
│  ✓ Verify franchise_id matches (for managers)                   │
│  ✓ Ensure employee belongs to same franchise                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   VALIDATION                                     │
│  ✓ Validate request data (Zod schema)                           │
│  ✓ Check employee exists                                        │
│  ✓ Check no duplicate attendance for date                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATABASE OPERATION                             │
│  INSERT INTO employee_attendance (                               │
│    franchise_id,  -- CRITICAL: Set from employee's franchise    │
│    employee_id,                                                  │
│    date,                                                         │
│    status,                                                       │
│    ...                                                           │
│  )                                                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CONSTRAINT CHECKS                              │
│  ✓ Foreign Key: franchise_id exists in franchises               │
│  ✓ Foreign Key: employee_id exists in employees                 │
│  ✓ Unique: (employee_id, date) combination                      │
│  ✓ Check: franchise_id matches employee's franchise             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AUDIT LOGGING                                  │
│  INSERT INTO audit_logs (                                        │
│    franchise_id,  -- Same as attendance record                  │
│    employee_id,   -- Who performed the action                   │
│    action: 'mark_attendance',                                   │
│    entity_type: 'attendance',                                   │
│    ...                                                           │
│  )                                                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   RESPONSE                                       │
│  ✓ Return created attendance record                             │
│  ✓ Include franchise_id for verification                        │
└─────────────────────────────────────────────────────────────────┘
```

## Authorization Matrix

```
┌──────────────────────────────────────────────────────────────────────┐
│                     AUTHORIZATION MATRIX                              │
├──────────────┬───────────┬──────────────┬──────────────┬────────────┤
│   Action     │   Admin   │   Manager    │   Employee   │   Scope    │
├──────────────┼───────────┼──────────────┼──────────────┼────────────┤
│ View         │           │              │              │            │
│ Employees    │  ✅ All   │ ✅ Franchise │  ❌ None     │  Global/   │
│              │           │    Only      │              │  Franchise │
├──────────────┼───────────┼──────────────┼──────────────┼────────────┤
│ Create       │           │              │              │            │
│ Employee     │  ✅ All   │ ✅ Franchise │  ❌ None     │  Global/   │
│              │           │    Only      │              │  Franchise │
├──────────────┼───────────┼──────────────┼──────────────┼────────────┤
│ Reset        │           │              │              │            │
│ Password     │  ✅ All   │ ✅ Franchise │  ✅ Own Only │  Global/   │
│              │           │  (not admin) │              │  Franchise │
├──────────────┼───────────┼──────────────┼──────────────┼────────────┤
│ Delete       │           │              │              │            │
│ Employee     │  ✅ Hard  │ ✅ Soft      │  ❌ None     │  Global/   │
│              │           │  Franchise   │              │  Franchise │
│              │           │  (not admin) │              │            │
├──────────────┼───────────┼──────────────┼──────────────┼────────────┤
│ Mark         │           │              │              │            │
│ Attendance   │  ✅ All   │ ✅ Franchise │  ❌ None     │  Global/   │
│              │           │    Only      │              │  Franchise │
├──────────────┼───────────┼──────────────┼──────────────┼────────────┤
│ View         │           │              │              │            │
│ Attendance   │  ✅ All   │ ✅ Franchise │  ✅ Own Only │  Global/   │
│              │           │    Only      │              │  Franchise │
├──────────────┼───────────┼──────────────┼──────────────┼────────────┤
│ Assign       │           │              │              │            │
│ Tasks        │  ✅ All   │ ✅ Franchise │  ❌ None     │  Global/   │
│              │           │    Only      │              │  Franchise │
├──────────────┼───────────┼──────────────┼──────────────┼────────────┤
│ View         │           │              │              │            │
│ Audit Logs   │  ✅ All   │ ✅ Franchise │  ❌ None     │  Global/   │
│              │           │    Only      │              │  Franchise │
└──────────────┴───────────┴──────────────┴──────────────┴────────────┘
```

## Database Isolation Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRANCHISES TABLE                             │
│  ┌────────────────────┐              ┌────────────────────┐         │
│  │ franchise-pollachi │              │ franchise-kinathuk │         │
│  │ (Pollachi Store)   │              │ (Kinathuk Store)   │         │
│  └─────────┬──────────┘              └─────────┬──────────┘         │
└────────────┼─────────────────────────────────────┼───────────────────┘
             │                                     │
             │ ON DELETE CASCADE                   │ ON DELETE CASCADE
             │                                     │
    ┌────────▼────────┐                  ┌────────▼────────┐
    │   EMPLOYEES     │                  │   EMPLOYEES     │
    │  franchise_id:  │                  │  franchise_id:  │
    │  pollachi       │                  │  kinathuk       │
    └────────┬────────┘                  └────────┬────────┘
             │                                     │
             │ ON DELETE CASCADE                   │ ON DELETE CASCADE
             │                                     │
    ┌────────▼────────┐                  ┌────────▼────────┐
    │   ATTENDANCE    │                  │   ATTENDANCE    │
    │  franchise_id:  │                  │  franchise_id:  │
    │  pollachi       │                  │  kinathuk       │
    │  ✓ ISOLATED     │                  │  ✓ ISOLATED     │
    └─────────────────┘                  └─────────────────┘
             │                                     │
    ┌────────▼────────┐                  ┌────────▼────────┐
    │     TASKS       │                  │     TASKS       │
    │  franchise_id:  │                  │  franchise_id:  │
    │  pollachi       │                  │  kinathuk       │
    │  ✓ ISOLATED     │                  │  ✓ ISOLATED     │
    └─────────────────┘                  └─────────────────┘
             │                                     │
    ┌────────▼────────┐                  ┌────────▼────────┐
    │   AUDIT LOGS    │                  │   AUDIT LOGS    │
    │  franchise_id:  │                  │  franchise_id:  │
    │  pollachi       │                  │  kinathuk       │
    │  ✓ ISOLATED     │                  │  ✓ ISOLATED     │
    └─────────────────┘                  └─────────────────┘

    ┌─────────────────────────────────────────────────────┐
    │         ISOLATION GUARANTEES                         │
    │  ✓ No cross-franchise queries possible              │
    │  ✓ Managers see only their franchise data           │
    │  ✓ Foreign keys enforce referential integrity       │
    │  ✓ Cascade delete maintains consistency             │
    │  ✓ Unique constraints prevent duplicates            │
    └─────────────────────────────────────────────────────┘
```

## Document Storage Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       ORDER CREATED                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  GENERATE DOCUMENTS                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Invoice    │  │   QR Code    │  │   Barcode    │          │
│  │   (PDF)      │  │   (Image)    │  │   (Image)    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STORE IN DATABASE                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  DOCUMENTS TABLE                                        │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │ id: doc-001                                       │  │    │
│  │  │ franchise_id: pollachi                           │  │    │
│  │  │ type: 'invoice'                                  │  │    │
│  │  │ order_id: order-123                              │  │    │
│  │  │ file_data: 'base64_encoded_pdf...'              │  │    │
│  │  │ file_url: 'https://supabase.co/storage/...'     │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  │                                                          │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │ id: doc-002                                       │  │    │
│  │  │ franchise_id: pollachi                           │  │    │
│  │  │ type: 'qr_code'                                  │  │    │
│  │  │ order_id: order-123                              │  │    │
│  │  │ file_data: 'base64_encoded_qr...'               │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  BARCODES TABLE                                         │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │ id: bc-001                                        │  │    │
│  │  │ franchise_id: pollachi                           │  │    │
│  │  │ code: 'ORD-2025-001'                             │  │    │
│  │  │ entity_type: 'order'                             │  │    │
│  │  │ entity_id: order-123                             │  │    │
│  │  │ image_data: 'base64_encoded_barcode...'         │  │    │
│  │  │ image_url: 'https://supabase.co/storage/...'    │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RETRIEVAL OPTIONS                             │
│  1. Direct from database (file_data)                            │
│  2. From Supabase Storage (file_url)                            │
│  3. Linked to order (order_id foreign key)                     │
└─────────────────────────────────────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                             │
│                                                                  │
│  Layer 1: AUTHENTICATION                                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ ✓ JWT Token Verification                               │    │
│  │ ✓ Employee ID Extraction                               │    │
│  │ ✓ Role Extraction                                      │    │
│  │ ✓ Franchise ID Extraction                              │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  Layer 2: AUTHORIZATION                                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ ✓ Role-Based Access Control (RBAC)                     │    │
│  │ ✓ Franchise-Scoped Permissions                         │    │
│  │ ✓ Resource Ownership Verification                      │    │
│  │ ✓ Action Permission Checks                             │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  Layer 3: DATABASE CONSTRAINTS                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ ✓ Foreign Key Constraints                              │    │
│  │ ✓ Unique Constraints                                   │    │
│  │ ✓ Check Constraints                                    │    │
│  │ ✓ NOT NULL Constraints                                 │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  Layer 4: ROW LEVEL SECURITY (RLS)                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ ✓ Franchise-Based Row Filtering                        │    │
│  │ ✓ Role-Based Row Access                                │    │
│  │ ✓ Automatic Policy Enforcement                         │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  Layer 5: AUDIT LOGGING                                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ ✓ All Actions Logged                                   │    │
│  │ ✓ Franchise-Scoped Logs                                │    │
│  │ ✓ IP Address & User Agent Captured                     │    │
│  │ ✓ Immutable Audit Trail                                │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

**Legend:**
- ✅ = Implemented and Verified
- ❌ = Not Allowed
- ✓ = Active/Enabled
- ▼ = Data Flow Direction
- │ = Connection/Relationship
