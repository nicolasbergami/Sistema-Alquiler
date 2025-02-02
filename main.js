const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const knex = require('./database');


let mainWindow; // Declaramos mainWindow en el ámbito global

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');
    mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// ✅ Escuchar el evento para reiniciar la UI sin cerrar la aplicación
// ✅ Escuchar el evento para reiniciar la aplicación
ipcMain.on('restart-app', () => {
  console.log("🔄 Reiniciando la aplicación...");
  app.relaunch(); // Relanza la aplicación
  app.exit(); // Cierra la instancia actual
});

// Ruta para obtener productos
ipcMain.handle('get-products', async () => {
  try {
      const productos = await knex('productos').select('*');
      console.log('Productos obtenidos:', productos); // 👈 Agregar este log para ver los productos
      return productos;
  } catch (error) {
      console.error('Error al obtener productos:', error);
      throw error;
  }
});
// Ruta para obtener un producto por ID
ipcMain.handle('get-product-by-id', async (event, id) => {
  return await knex('productos').where('id', id).first();
});

// Ruta para agregar un producto
ipcMain.handle('add-product', async (event, product) => {
  return await knex('productos').insert(product);
});

// Ruta para actualizar un producto
ipcMain.handle('update-product', async (event, id, product) => {
  return await knex('productos').where('id', id).update(product);
});

// Ruta para eliminar un producto
ipcMain.handle('delete-product', async (event, id) => {
  return await knex('productos').where('id', id).del();
});



// Ruta para desbloquear el producto (cambiar estado a 'Disponible')
ipcMain.handle('unlock-product', async (event, id) => {
  try {
      // Obtener los pagos antes de eliminarlos
      const pagosRealizados = await knex('pagos')
          .where('producto_id', id)
          .andWhere('estado_pago', 'pagado');

      // Insertar los pagos en la tabla ingresos antes de eliminarlos
      if (pagosRealizados.length > 0) {
          const ingresosData = pagosRealizados.map(pago => ({
              producto_id: pago.producto_id,
              monto_pagado: pago.monto_pagado,
              fecha_pago: pago.fecha_pago
          }));
          await knex('ingresos').insert(ingresosData);
      }

      // Eliminar pagos del producto después de mover los pagados a ingresos
      await knex('pagos').where('producto_id', id).del();

      // Cambiar estado del producto a "Disponible"
      await knex('productos').where('id', id).update({
          estado: 'Disponible',
          cliente: '',
          telefono: '',
          direccion: '',
          periodo: '',
          pago: false
      });

      console.log(`✅ Producto ${id} desbloqueado y pagos guardados en ingresos.`);
  } catch (error) {
      console.error('❌ Error al desbloquear el producto:', error);
      throw error;
  }
});

// Ruta para obtener clientes
ipcMain.handle('get-clients', async () => {
  try {
    const clients = await knex('clientes').select('*'); // 📌 Asegúrate de que esto devuelve un ARRAY
    console.log("🔍 Clientes desde BD:", clients);
    return clients;
  } catch (error) {
    console.error("❌ Error al obtener clientes:", error);
    return []; // Retorna un array vacío en caso de error
  }
});


// Ruta para agregar un cliente
ipcMain.handle('add-client', async (event, clientData) => {
  try {
      console.log("📩 Datos recibidos en backend:", clientData); // Verifica los datos recibidos

      // Asegúrate de que el DNI esté presente
      if (!clientData.dni) {
          throw new Error("El DNI es obligatorio");
      }

      await knex('clientes').insert(clientData);
      console.log("✅ Cliente insertado correctamente.");
  } catch (error) {
      console.error("❌ Error al agregar cliente en backend:", error);
      throw error;
  }
});








// Ruta para actualizar un cliente
ipcMain.handle('update-client', async (event, id, clientData) => {
  return await knex('clientes').where('id', id).update(clientData);
});

ipcMain.handle('get-client-by-dni', async (event, dni) => {
  try {
      const client = await knex('clientes').where('dni', dni).first();
      console.log('Cliente encontrado con DNI:', dni, client); // Mostrar el cliente completo
      return client || null;
  } catch (error) {
      console.error('Error al buscar cliente por DNI:', error);
      throw error;
  }
});



ipcMain.handle('delete-client', async (event, clientId) => {
  try {
      // Eliminar el cliente de la base de datos
      await knex('clientes').where('id', clientId).del();
      console.log(`Cliente con ID ${clientId} eliminado correctamente.`);
  } catch (error) {
      console.error('Error al eliminar el cliente:', error);
      throw error;
  }
});
ipcMain.handle('update-status', async (event, id, data) => {
  try {
      console.log("📩 Datos recibidos en update-status:", data);

      const result = await knex('productos')
          .where('id', id)
          .update({
              cliente: data.cliente,
              telefono: data.telefono,
              direccion: data.direccion,
              periodo: `${data.inicioMes} - ${data.finMes}`, // Combina los meses
              pago: data.pago || false,
              estado: 'No disponible',
          });

      console.log("🟢 Producto actualizado en la base de datos:", result);
      
      if (data.inicioMes && data.finMes) {
          const meses = [
              "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
              "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
          ];

          let pagos = [];
          let inicioIndex = parseInt(data.inicioMes, 10) - 1;
          let finIndex = parseInt(data.finMes, 10) - 1;

          // 🔥 Si el mes de fin es menor que el de inicio, significa que pasa de año
          if (finIndex < inicioIndex) {
              // Primero, agregar desde inicio hasta diciembre
              for (let i = inicioIndex; i < 12; i++) {
                  pagos.push({ producto_id: id, mes: meses[i], estado_pago: 'debe' });
              }
              // Luego, agregar desde enero hasta el finIndex
              for (let i = 0; i <= finIndex; i++) {
                  pagos.push({ producto_id: id, mes: meses[i], estado_pago: 'debe' });
              }
          } else {
              // Si no cruza de año, se inserta normalmente
              for (let i = inicioIndex; i <= finIndex; i++) {
                  pagos.push({ producto_id: id, mes: meses[i], estado_pago: 'debe' });
              }
          }

          await knex('pagos').insert(pagos);
          console.log("✅ Pagos registrados correctamente.");
      }

      return result;
  } catch (error) {
      console.error('❌ Error al actualizar el estado del producto:', error);
      throw error;
  }
});


ipcMain.handle('get-pagos-by-producto', async (event, productoId) => {
  try {
      return await knex('pagos').where('producto_id', productoId);
  } catch (error) {
      console.error('Error al obtener pagos:', error);
      throw error;
  }
});
ipcMain.handle("update-pago", async (event, pagoId, data) => {
  try {
      // Obtener datos del pago antes de actualizar
      const pago = await knex("pagos").where("id", pagoId).first();
      if (!pago) throw new Error("Pago no encontrado");

      // Obtener el monto del producto pagado
      const producto = await knex("productos").where("id", pago.producto_id).first();
      if (!producto) throw new Error("Producto no encontrado");

      const monto = producto.precio; // El monto a pagar es el precio del producto

      // Actualizar estado del pago en la tabla pagos
      await knex("pagos").where("id", pagoId).update({ 
          estado_pago: "pagado",
          fecha_pago: knex.fn.now(),
          monto_pagado: monto
      });

      // Registrar el pago en la tabla ingresos
      await knex("ingresos").insert({
          fecha_pago: knex.fn.now(),
          monto_pagado: monto
      });

      console.log(`✅ Pago de ${monto} registrado correctamente en ingresos.`);
  } catch (error) {
      console.error("❌ Error al actualizar pago:", error);
      throw error;
  }
});


// 🔥 Ruta para eliminar todos los pagos de un producto al devolverlo
ipcMain.handle('delete-pagos-by-producto', async (event, productoId) => {
  try {
      await knex('pagos').where('producto_id', productoId).del();
      console.log(`✅ Pagos del producto ${productoId} eliminados correctamente.`);
      return { success: true };
  } catch (error) {
      console.error('❌ Error al eliminar pagos del producto:', error);
      throw error;
  }
});

ipcMain.handle('restart-app', () => {
  console.log("🔄 Aplicación reiniciándose...");
  app.relaunch();
  app.quit();
});

ipcMain.handle('get-ingresos', async () => {
  try {
      const ingresos30 = await knex('ingresos')
          .whereNotNull('fecha_pago')
          .andWhere('fecha_pago', '>=', knex.raw("DATE('now', '-30 days')"))
          .sum('monto_pagado as total_ingresos');

      const ingresos90 = await knex('ingresos')
          .whereNotNull('fecha_pago')
          .andWhere('fecha_pago', '>=', knex.raw("DATE('now', '-90 days')"))
          .sum('monto_pagado as total_ingresos');

      const ingresos365 = await knex('ingresos')
          .whereNotNull('fecha_pago')
          .andWhere('fecha_pago', '>=', knex.raw("DATE('now', '-365 days')"))
          .sum('monto_pagado as total_ingresos');

      const ingresos = [
          { periodo: "Últimos 30 días", total_ingresos: ingresos30[0].total_ingresos || 0 },
          { periodo: "Últimos 90 días", total_ingresos: ingresos90[0].total_ingresos || 0 },
          { periodo: "Últimos 365 días", total_ingresos: ingresos365[0].total_ingresos || 0 }
      ];

      console.log("📊 Ingresos obtenidos:", ingresos);
      return ingresos;
  } catch (error) {
      console.error("❌ Error al obtener ingresos:", error);
      throw error;
  }
});







