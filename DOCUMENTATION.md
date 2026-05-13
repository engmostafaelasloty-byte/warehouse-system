# Technical Documentation - Warehouse Management System

Thank you for purchasing our Warehouse Management System. This guide will help you set up and customize the application.

## 1. Requirements
- **Node.js**: v18.x or higher
- **MongoDB**: A local instance or a MongoDB Atlas URI
- **NPM**: v9.x or higher

## 2. Setup Instructions
Follow these steps to get the system running:

### Step 1: Extract and Install
Extract the source code zip file and navigate to the project directory:
```bash
cd warehouse-system
npm install
```

### Step 2: Environment Configuration
Create a file named `.env.local` in the root directory and add your MongoDB connection string:
```env
MONGODB_URI=your_mongodb_connection_string_here
```

### Step 3: Run the Application
For development:
```bash
npm run dev
```
For production:
```bash
npm run build
npm start
```

## 3. Project Structure
- `/app`: Contains all routes and API endpoints.
- `/components`: Reusable UI components (Sidebar, Selector, Providers).
- `/lib`: Database connection logic and translation dictionaries.
- `/models`: MongoDB Mongoose schemas (Product, Warehouse, Incoming, Outgoing).
- `/public`: Static assets (images, icons).

## 4. Key Configurations
- **Translations**: You can add more languages or modify existing text in `lib/translations.js`.
- **Styling**: The entire design system is based on CSS Variables in `app/globals.css`. You can change the primary colors (blue, green, red) globally from there.

## 5. Security Features
- **MongoDB Transactions**: Used in `api/incoming` and `api/outgoing` to ensure that stock levels and transaction records are updated atomically.
- **Soft Delete**: Deleting a warehouse or product only sets `isActive: false`, ensuring historical data remains intact.

## 6. Support
If you have any questions or need customization, feel free to contact us through the Codester support system.

---
*Created by [Your Name/Brand]*
