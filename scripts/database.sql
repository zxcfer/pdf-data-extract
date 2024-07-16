DROP TYPE IF EXISTS property_status;

CREATE TYPE property_status AS ENUM('PENDING', 'DONE', 'ERROR');

DROP TABLE IF EXISTS properties;

CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    url VARCHAR(255) NOT NULL,
    status property_status NOT NULL,
    title VARCHAR(255),
    asking_price NUMERIC(10, 2),
    address VARCHAR(255),
    days_on_market INTEGER,
    time_since_last_update VARCHAR(255),
    earnest_money_deposit VARCHAR(255),
    date_added VARCHAR(255),
    days_on NUMERIC(10, 2),
    time_since_last_update NUMERIC(10, 2),
    property_type VARCHAR(255),
    subtype VARCHAR(255),
    size VARCHAR(255),
    investment_type VARCHAR(255),
    investment_sub_type VARCHAR(255),
    class VARCHAR(255),
    tenancy VARCHAR(255),
    tenant_credit VARCHAR(255),
    brand_tenant VARCHAR(255),
    square_footage NUMERIC(10, 2),
    net_rentable NUMERIC(10, 2),
    price_sq_ft NUMERIC(10, 2),
    cap_rate NUMERIC(10, 2),
    pro_forma_cap_rate NUMERIC(10, 2),
    occupancy VARCHAR(255),
    parking VARCHAR(255),
    noi NUMERIC(10, 2),
    pro_forma_noi NUMERIC(10, 2),
    units NUMERIC(10, 2),
    year_built NUMERIC(10, 2),
    year_renovated NUMERIC(10, 2),
    buildings NUMERIC(10, 2),
    stories NUMERIC(10, 2),
    zoning NUMERIC(10, 2),
    lot_size NUMERIC(10, 2),
    price_unit NUMERIC(10, 2),
    ceiling_height NUMERIC(10, 2),
    lease_type VARCHAR(255),
    lease_term VARCHAR(255),
    lease_expiration VARCHAR(255),
    lease_options VARCHAR(255),
    lease_commencement VARCHAR(255),
    ground_lease VARCHAR(255),
    remaining_term VARCHAR(255),
    rent_bumps VARCHAR(255),
    sale_condition VARCHAR(255),
    housing_occupancy_ratio: VARCHAR(255),
    housing_occupancy_ratio_predicted: VARCHAR(255),
    renter_to_homeowner_ratio_predicted: VARCHAR(255),
    marketing_description
    number_of_employees
    investment_highlights
    population
    household_income
    age_demographics

);

