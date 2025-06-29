# database/Dockerfile
FROM postgres:15

# Set environment variables
ENV POSTGRES_DB=eligibility_db
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=password

# Copy initialization script
COPY init.sql /docker-entrypoint-initdb.d/

# Expose PostgreSQL port
EXPOSE 5432