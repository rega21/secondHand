# Sports Footwear Web

## Overview
This project is a web application for showcasing and selling sports footwear. It is designed to provide users with an intuitive interface to browse products, view details, and make purchases.

## Project Structure
The project is organized into the following directories:

- **src/components**: Contains reusable UI components for the application.
- **src/pages**: Holds different pages such as the home page, product listings, and contact page.
- **src/styles**: Contains CSS or styling files for global and component-specific styles.
- **src/assets**: Stores static assets like images, fonts, and icons.
- **src/utils**: Includes utility functions and helpers for use across the application.

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node package manager)

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd sports-footwear-web
   ```
3. Install the dependencies:
   ```
   npm install
   ```

### Running the Application
To start the development server, run:
```
npm start
```
The application will be available at `http://localhost:3000`.

### Building for Production
To create a production build, run:
```
npm run build
```
The build files will be generated in the `dist` directory.

## Datos de Productos

Los productos reales de la aplicación se obtienen desde la API de MockAPI:

- [https://683db271199a0039e9e68933.mockapi.io/api-secondhand/productos](https://683db271199a0039e9e68933.mockapi.io/api-secondhand/productos)

El archivo [`src/productos.json`](src/productos.json) solo contiene un producto de ejemplo para referencia de formato y **no es utilizado por la aplicación en producción**.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.