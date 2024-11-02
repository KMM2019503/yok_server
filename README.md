# Project Setup

This document provides instructions for setting up the project, including configuration and running the development and production environments.

## Prerequisites

Ensure you have the following installed:

- [Bun](https://bun.sh/)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

## Project Structure

- Place your Firebase service account key in the project folder as `firebase-service-keys.json`.
- in project folder, there should be a script called `source_env.sh` to manage your environment variables.

## Setup Instructions

1. **Generate Prisma Client (if required):**

   Run the following command to generate the Prisma client:

   ```bash
   bunx prisma generate
   ```

2. **Set Permissions on the Environment Script:**

   Make the source_env.sh script executable:

   ```bash
    chmod +x source_env.sh
   ```

3. **Running the Development Environment:**

   To start the development environment, run:

   ```bash
   source ./source_env.sh && docker-compose up --build
   ```

4. **Running the Production Environment:**

   To start the production environment, run:

   ```bash
   source ./source_env.sh && docker-compose -f docker-compose.prod.yml up --build -d
   ```

   _Notes_

   - Ensure that all environment variables required for your application are defined in .env.
   - The production environment will run in detached mode due to the -d flag.
