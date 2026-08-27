# Database Module

This module handles the connection and interactions with the PostgreSQL database.

## Technologies Used

- **MikroORM** - ORM for PostgreSQL
- **PostgreSQL** - Relational database

## Features

- Database connection configuration
- Migration management
- Seed management (word packs: insert missing labels on API start; never deletes). MikroORM loads **every** file in `src/seeders`, so keep tests and helpers outside that folder
- Entity and relationship management
- Transaction support
- Development mode logging
