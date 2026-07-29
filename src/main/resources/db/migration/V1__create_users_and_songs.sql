-- Baseline schema matching existing User and Songs JPA entities.
-- For databases that already have these tables (created via Hibernate ddl-auto),
-- configure flyway.baseline-on-migrate=true and flyway.baseline-version=1 so this
-- script is skipped and only later migrations run.

CREATE TABLE users (
    id UUID NOT NULL,
    username VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE songs (
    id UUID NOT NULL,
    location VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    duration INTEGER NOT NULL,
    album VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    CONSTRAINT pk_songs PRIMARY KEY (id)
);
