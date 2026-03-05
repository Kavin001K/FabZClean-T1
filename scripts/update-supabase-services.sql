BEGIN;

-- Delete all existing services
TRUNCATE TABLE "services" CASCADE;

-- Insert new services
INSERT INTO "services" ("name", "category", "description", "price", "duration", "status") VALUES 
('Shirt (Wash + Starch)', 'Wash Service', 'WS001 | 890100000001 | White/Color | Tax: 5%', 45.00, '120 mins', 'Active'),
('Pant (Wash + Starch)', 'Wash Service', 'WS002 | 890100000002 | White/Color | Tax: 5%', 50.00, '120 mins', 'Active'),
('Dhoti (Wash + Starch)', 'Wash Service', 'WS003 | 890100000003 | White/Color | Tax: 5%', 50.00, '120 mins', 'Active'),
('Shirt (Wash + Iron)', 'Wash Service', 'WS004 | 890100000004 | Tax: 5%', 45.00, '120 mins', 'Active'),
('Pant (Wash + Iron)', 'Wash Service', 'WS005 | 890100000005 | Tax: 5%', 45.00, '120 mins', 'Active'),
('Jeans (Wash + Iron)', 'Wash Service', 'WS006 | 890100000006 | Tax: 5%', 45.00, '120 mins', 'Active'),

('Shirt / T-Shirt', 'Premium Clothing', 'PC001 | 890100000101 | Tax: 5%', 90.00, '120 mins', 'Active'),
('Dhoti', 'Premium Clothing', 'PC002 | 890100000102 | Tax: 5%', 90.00, '120 mins', 'Active'),
('Silk Shirt / Silk Dhoti', 'Premium Clothing', 'PC003 | 890100000103 | Tax: 5%', 120.00, '120 mins', 'Active'),
('Coat / Blazer', 'Premium Clothing', 'PC004 | 890100000104 | Tax: 5%', 255.00, '120 mins', 'Active'),
('Sherwani', 'Premium Clothing', 'PC005 | 890100000105 | Tax: 5%', 400.00, '120 mins', 'Active'),

('Shirt / T-Shirt', 'Regular Clothing', 'RC001 | 890100000201 | Tax: 5%', 75.00, '120 mins', 'Active'),
('Pant / Shorts', 'Regular Clothing', 'RC002 | 890100000202 | Tax: 5%', 75.00, '120 mins', 'Active'),
('Dhoti', 'Regular Clothing', 'RC003 | 890100000203 | Tax: 5%', 75.00, '120 mins', 'Active'),

('Bed Sheet (Single)', 'Household Items', 'HH001 | 890100000301 | Tax: 5%', 90.00, '120 mins', 'Active'),
('Bed Sheet (Double)', 'Household Items', 'HH002 | 890100000302 | Tax: 5%', 140.00, '120 mins', 'Active'),
('Sports Shoes / Sneakers', 'Household Items', 'HH003 | 890100000303 | Tax: 12%', 300.00, '120 mins', 'Active'),
('Leather Shoe', 'Household Items', 'HH004 | 890100000304 | Tax: 12%', 400.00, '120 mins', 'Active');

COMMIT;
