-- ============================================================================
-- FabZClean BI Suite - Daily Summaries Table Upgrade
-- Migration: 003_daily_summaries_bi_upgrade
-- Description: Enterprise-grade analytics data warehouse schema
-- ============================================================================

-- Drop existing table if it exists (only in dev, be careful in prod)
-- DROP TABLE IF EXISTS daily_summaries CASCADE;

-- Create or update the daily_summaries table with all BI metrics
CREATE TABLE IF NOT EXISTS daily_summaries (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    franchise_id VARCHAR(255) REFERENCES franchises(id),
    date TIMESTAMP NOT NULL,

    -- ============================================================================
    -- REVENUE METRICS
    -- ============================================================================
    total_revenue DECIMAL(14, 2) DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    avg_order_value DECIMAL(10, 2) DEFAULT 0,
    
    -- Growth Metrics
    revenue_growth_daily DECIMAL(8, 4),      -- vs previous day %
    revenue_growth_weekly DECIMAL(8, 4),     -- vs same day last week %
    revenue_growth_mom DECIMAL(8, 4),        -- Month over Month %
    revenue_growth_yoy DECIMAL(8, 4),        -- Year over Year %

    -- ============================================================================
    -- PREDICTIVE METRICS
    -- ============================================================================
    projected_month_end_revenue DECIMAL(14, 2),
    revenue_velocity DECIMAL(8, 4),          -- Current vs 7-day SMA %
    revenue_velocity_trend VARCHAR(20) CHECK (revenue_velocity_trend IN ('accelerating', 'decelerating', 'stable')),
    at_risk_revenue DECIMAL(12, 2) DEFAULT 0, -- Orders past due
    
    -- Linear Regression for Revenue Forecasting (y = mx + b)
    regression_slope DECIMAL(12, 6),         -- m
    regression_intercept DECIMAL(12, 2),     -- b
    regression_r2 DECIMAL(5, 4),             -- Coefficient of determination
    forecast_next_7_days JSONB,              -- [{ date, predicted, confidence }]

    -- ============================================================================
    -- CUSTOMER METRICS
    -- ============================================================================
    customer_count INTEGER DEFAULT 0,
    new_customer_count INTEGER DEFAULT 0,
    returning_customer_count INTEGER DEFAULT 0,
    
    -- Customer Lifetime Value (CLV) Metrics
    avg_customer_clv DECIMAL(12, 2),
    total_platinum_customers INTEGER DEFAULT 0,
    total_gold_customers INTEGER DEFAULT 0,
    total_silver_customers INTEGER DEFAULT 0,
    total_bronze_customers INTEGER DEFAULT 0,
    
    -- Cohort Metrics
    customer_churn_rate DECIMAL(6, 4),       -- %
    avg_retention_rate DECIMAL(6, 4),        -- %
    cohort_data JSONB,                       -- Detailed cohort retention matrix

    -- ============================================================================
    -- SERVICE METRICS (Contribution Analysis)
    -- ============================================================================
    top_service_id VARCHAR(255),
    top_service_name TEXT,
    top_service_revenue DECIMAL(12, 2),
    
    -- Service Mix Variance: (Actual% - Target%) * TotalRevenue
    service_mix_variance DECIMAL(12, 2),
    hero_services_count INTEGER DEFAULT 0,   -- High margin performers
    loss_leader_services_count INTEGER DEFAULT 0,
    
    -- Detailed breakdown
    service_mix JSONB,                       -- { serviceId: { name, count, revenue, actualPercent, variance, category } }
    service_correlation_top5 JSONB,          -- Top 5 frequently bought together pairs

    -- ============================================================================
    -- OPERATIONAL METRICS (Little's Law: L = λ × W)
    -- ============================================================================
    avg_turnaround_hours DECIMAL(10, 2),
    turnaround_std_dev DECIMAL(10, 4),       -- Variance in hours
    turnaround_consistency_score INTEGER,     -- 0-100
    percent_within_target DECIMAL(6, 2),     -- % within ±2 hours
    
    -- Little's Law Components
    orders_arrival_rate DECIMAL(10, 4),      -- λ (orders per day)
    avg_wait_time DECIMAL(10, 4),            -- W (processing days)
    items_in_process DECIMAL(10, 2),         -- L = λ × W
    bottleneck_type VARCHAR(20) CHECK (bottleneck_type IN ('volume', 'processing', 'balanced')),
    bottleneck_recommendation TEXT,
    
    -- Order Status Metrics
    ready_on_time_count INTEGER DEFAULT 0,
    delayed_order_count INTEGER DEFAULT 0,
    pending_orders_count INTEGER DEFAULT 0,
    completed_orders_count INTEGER DEFAULT 0,

    -- ============================================================================
    -- STAFF PRODUCTIVITY (Weighted Z-Scores)
    -- ============================================================================
    avg_staff_z_score DECIMAL(6, 4),
    top_performer_employee_id VARCHAR(255),
    top_performer_name TEXT,
    top_performer_z_score DECIMAL(6, 4),
    total_staff_productivity DECIMAL(12, 2), -- Weighted items/hr
    
    -- Detailed staff breakdown
    staff_performance JSONB,                 -- { staffId: { name, zScore, percentile, rating, weightedScore } }

    -- ============================================================================
    -- TAX METRICS (GST Breakout Model)
    -- ============================================================================
    total_tax_collected DECIMAL(12, 2) DEFAULT 0,
    cgst_amount DECIMAL(12, 2) DEFAULT 0,
    sgst_amount DECIMAL(12, 2) DEFAULT 0,
    igst_amount DECIMAL(12, 2) DEFAULT 0,
    taxable_amount DECIMAL(14, 2) DEFAULT 0,
    
    -- HSN/SAC Code Breakdown
    tax_by_hsn_code JSONB,                   -- { hsnCode: { taxableAmount, cgst, sgst, igst } }

    -- ============================================================================
    -- FINANCIAL METRICS (Contribution Margin)
    -- ============================================================================
    total_cost DECIMAL(12, 2) DEFAULT 0,
    contribution_margin DECIMAL(8, 4),       -- Percentage
    gross_profit DECIMAL(14, 2),
    
    -- Payment breakdown
    payment_method_mix JSONB,                -- { cash: amount, upi: amount, card: amount, credit: amount }
    credit_sales_amount DECIMAL(12, 2) DEFAULT 0,
    credit_collected_amount DECIMAL(12, 2) DEFAULT 0,

    -- ============================================================================
    -- ANOMALY DETECTION (Fraud Audit)
    -- ============================================================================
    anomaly_count INTEGER DEFAULT 0,
    anomaly_details JSONB,                   -- [{ orderId, orderNumber, zScore, flagReason }]
    suspicious_order_ids JSONB,              -- Array of order IDs >3 std devs

    -- ============================================================================
    -- STATISTICAL AGGREGATES
    -- ============================================================================
    order_value_mean DECIMAL(10, 2),
    order_value_median DECIMAL(10, 2),
    order_value_mode DECIMAL(10, 2),
    order_value_std_dev DECIMAL(10, 4),
    order_value_variance DECIMAL(14, 4),
    order_value_p25 DECIMAL(10, 2),
    order_value_p75 DECIMAL(10, 2),
    order_value_p85 DECIMAL(10, 2),
    order_value_p95 DECIMAL(10, 2),

    -- ============================================================================
    -- PEAK DEMAND HEATMAP DATA
    -- ============================================================================
    peak_demand_hour INTEGER CHECK (peak_demand_hour >= 0 AND peak_demand_hour <= 23),
    peak_demand_day_of_week INTEGER CHECK (peak_demand_day_of_week >= 0 AND peak_demand_day_of_week <= 6),
    peak_demand_score DECIMAL(5, 4),         -- 0-1 normalized
    demand_heatmap_top10 JSONB,              -- Top 10 busiest time slots

    -- ============================================================================
    -- MOVING AVERAGES (Seasonality)
    -- ============================================================================
    sma_7_day_revenue DECIMAL(12, 2),        -- 7-day Simple Moving Average
    sma_14_day_revenue DECIMAL(12, 2),       -- 14-day SMA
    sma_30_day_revenue DECIMAL(12, 2),       -- 30-day SMA
    ema_7_day_revenue DECIMAL(12, 2),        -- 7-day Exponential Moving Average

    -- ============================================================================
    -- METADATA & AUDIT
    -- ============================================================================
    calculation_duration_ms INTEGER,         -- Time to compute this summary
    data_quality_score INTEGER CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
    last_recalculated_at TIMESTAMP,
    version INTEGER DEFAULT 1,               -- Schema version for migrations
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE (franchise_id, date)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Primary lookup index (franchise + date range queries)
CREATE INDEX IF NOT EXISTS idx_daily_summaries_franchise_date 
ON daily_summaries (franchise_id, date DESC);

-- Date range queries
CREATE INDEX IF NOT EXISTS idx_daily_summaries_date 
ON daily_summaries (date DESC);

-- Revenue analysis
CREATE INDEX IF NOT EXISTS idx_daily_summaries_revenue 
ON daily_summaries (total_revenue DESC);

-- Anomaly detection queries
CREATE INDEX IF NOT EXISTS idx_daily_summaries_anomalies 
ON daily_summaries (anomaly_count) WHERE anomaly_count > 0;

-- Staff performance lookup
CREATE INDEX IF NOT EXISTS idx_daily_summaries_top_performer 
ON daily_summaries (top_performer_employee_id);

-- ============================================================================
-- HELPER FUNCTION: Upsert Daily Summary
-- ============================================================================

CREATE OR REPLACE FUNCTION upsert_daily_summary(
    p_franchise_id VARCHAR(255),
    p_date DATE,
    p_data JSONB
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO daily_summaries (
        franchise_id, 
        date, 
        total_revenue,
        order_count,
        avg_order_value,
        updated_at
    )
    VALUES (
        p_franchise_id,
        p_date,
        COALESCE((p_data->>'totalRevenue')::DECIMAL, 0),
        COALESCE((p_data->>'orderCount')::INTEGER, 0),
        COALESCE((p_data->>'avgOrderValue')::DECIMAL, 0),
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (franchise_id, date)
    DO UPDATE SET
        total_revenue = COALESCE((p_data->>'totalRevenue')::DECIMAL, daily_summaries.total_revenue),
        order_count = COALESCE((p_data->>'orderCount')::INTEGER, daily_summaries.order_count),
        avg_order_value = COALESCE((p_data->>'avgOrderValue')::DECIMAL, daily_summaries.avg_order_value),
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENT DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE daily_summaries IS 'Enterprise BI Data Warehouse - Pre-calculated analytics for fast dashboard loads (<200ms)';
COMMENT ON COLUMN daily_summaries.regression_slope IS 'Linear regression slope (m) for revenue trend: y = mx + b';
COMMENT ON COLUMN daily_summaries.regression_r2 IS 'R-squared coefficient of determination (0-1), measures forecast accuracy';
COMMENT ON COLUMN daily_summaries.items_in_process IS 'Littles Law: L = λ × W (arrival rate × wait time)';
COMMENT ON COLUMN daily_summaries.turnaround_consistency_score IS 'Score 0-100 based on standard deviation of turnaround times';
COMMENT ON COLUMN daily_summaries.avg_staff_z_score IS 'Average Z-score of staff productivity (0 = average, positive = better)';
COMMENT ON COLUMN daily_summaries.service_mix_variance IS 'Contribution analysis: (Actual% - Target%) × TotalRevenue';
