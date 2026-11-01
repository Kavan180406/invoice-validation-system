
CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'STAFF'
        CHECK (role IN ('ADMIN', 'STAFF')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendors (
    vendor_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    vendor_name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(20),
    tax_id VARCHAR(30) UNIQUE,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
    invoice_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL,
    vendor_id BIGINT NOT NULL,
    uploaded_by BIGINT,
    invoice_date DATE NOT NULL,
    due_date DATE,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN (
            'PENDING', 'VERIFIED', 'DUPLICATE', 'REJECTED', 'FLAGGED'
        )),
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoice_vendor
        FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id),
    CONSTRAINT fk_invoice_user
        FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
        ON DELETE SET NULL,
    CONSTRAINT chk_invoice_dates
        CHECK (due_date IS NULL OR due_date >= invoice_date)
);

CREATE TABLE IF NOT EXISTS invoice_items (
    item_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    item_description VARCHAR(255) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0
        CHECK (tax_rate BETWEEN 0 AND 100),
    line_total NUMERIC(14, 2)
        GENERATED ALWAYS AS (quantity * unit_price) STORED,
    CONSTRAINT fk_item_invoice
        FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS validations (
    validation_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    validated_by BIGINT,
    validation_status VARCHAR(20) NOT NULL
        CHECK (validation_status IN ('PASSED', 'FAILED', 'FLAGGED')),
    risk_score NUMERIC(5, 2) NOT NULL DEFAULT 0
        CHECK (risk_score BETWEEN 0 AND 100),
    validation_message TEXT,
    validated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_validation_invoice
        FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_validation_user
        FOREIGN KEY (validated_by) REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS duplicate_checks (
    duplicate_check_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    matched_invoice_id BIGINT NOT NULL,
    similarity_score NUMERIC(5, 2) NOT NULL
        CHECK (similarity_score BETWEEN 0 AND 100),
    detection_reason TEXT,
    review_status VARCHAR(20) NOT NULL DEFAULT 'UNDER_REVIEW'
        CHECK (review_status IN (
            'CONFIRMED', 'UNDER_REVIEW', 'DISMISSED'
        )),
    checked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_duplicate_invoice
        FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_matched_invoice
        FOREIGN KEY (matched_invoice_id) REFERENCES invoices(invoice_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_different_invoices
        CHECK (invoice_id <> matched_invoice_id),
    CONSTRAINT uq_duplicate_pair
        UNIQUE (invoice_id, matched_invoice_id)
);

CREATE INDEX IF NOT EXISTS idx_invoices_vendor
    ON invoices(vendor_id);

CREATE INDEX IF NOT EXISTS idx_invoices_date
    ON invoices(invoice_date);

CREATE INDEX IF NOT EXISTS idx_invoices_status
    ON invoices(status);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice
    ON invoice_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_validations_invoice
    ON validations(invoice_id);

CREATE INDEX IF NOT EXISTS idx_duplicate_checks_invoice
    ON duplicate_checks(invoice_id);

CREATE INDEX IF NOT EXISTS idx_duplicate_checks_status
    ON duplicate_checks(review_status);

CREATE INDEX IF NOT EXISTS idx_vendors_name
    ON vendors(vendor_name);
