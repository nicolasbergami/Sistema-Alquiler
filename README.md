
## 🖥️ Electron CRUD - Gestión de Productos y Clientes

### 📌 Descripción

Este es un sistema de gestión de productos y clientes desarrollado con **Electron.js**, **SQLite** y **Knex.js**. Permite registrar productos, gestionar clientes, registrar pagos y generar reportes de ingresos.  

✅ **Características principales**:
- CRUD de productos y clientes.
- Control de pagos y estado de alquiler de productos.
- Registro de ingresos generados por los pagos.
- Uso de **SQLite** como base de datos local.
- Generación de un ejecutable para Windows mediante **Electron Builder**.

---

## 📂 Instalación y configuración

### 🔧 **1. Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/electron-crud.git
cd electron-crud
```

### 📦 **2. Instalar dependencias**
Asegúrate de tener **Node.js** instalado en tu sistema, luego ejecuta:
```bash
npm install
```

### ⚡ **3. Ejecutar la aplicación en modo desarrollo**
```bash
npm start
```
Esto abrirá la ventana de la aplicación en modo de desarrollo.

---

## 🚀 Creación del ejecutable (.exe)

### 📥 **1. Instalar Electron Builder**
Si no está instalado, ejecuta:
```bash
npm install electron-builder --save-dev
```

### 🛠️ **2. Configurar `package.json`**
Agrega la siguiente configuración en tu `package.json`:

```json
{
  "name": "electron-crud",
  "version": "1.0.0",
  "description": "Aplicación de gestión de productos y clientes con Electron",
  "main": "src/main.js",
  "scripts": {
    "start": "electron .",
    "dist": "electron-builder"
  },
  "devDependencies": {
    "electron": "^24.0.0",
    "electron-builder": "^24.0.0"
  },
  "build": {
    "appId": "com.miapp.electron",
    "productName": "Electron CRUD",
    "files": [
      "**/*"
    ],
    "directories": {
      "output": "dist"
    },
    "win": {
      "target": "nsis"
    }
  }
}
```

### 📦 **3. Generar el ejecutable**
Ejecuta el siguiente comando:
```bash
npm run dist
```
Este comando generará un instalador `.exe` dentro de la carpeta `dist/` que puedes distribuir y ejecutar en Windows.

---

## 📌 **Base de Datos**
El proyecto usa **SQLite** con **Knex.js** para la gestión de la base de datos.

Si necesitas resetear la base de datos, puedes eliminar el archivo `database.sqlite` y reiniciar la aplicación.

Estructura de las tablas:
- **productos**: Registra productos disponibles para alquiler.
- **clientes**: Registra clientes con su información de contacto.
- **pagos**: Lleva el control de los pagos realizados por los clientes.
- **ingresos**: Registra el dinero generado por los pagos.

---


## 🎯 **Contacto y Contribuciones**

📧 Contacto: nicolasbergami2013@gmail.com

---

