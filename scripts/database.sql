
CREATE TYPE property_status AS ENUM('PENDING', 'DONE', 'ERROR');

-- create property table
CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    url VARCHAR(255) NOT NULL,
    status property_status NOT NULL,
    title VARCHAR(255),
    price NUMERIC(10, 2),
    location VARCHAR(255),
    type VARCHAR(255),
    size VARCHAR(255)
);

-- drop property table
DROP TABLE IF EXISTS properties;

-- drop property_status type
DROP TYPE IF EXISTS property_status;

