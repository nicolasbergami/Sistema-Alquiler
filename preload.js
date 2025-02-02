const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('api', {
  getProducts: () => ipcRenderer.invoke('get-products'),
  getProductById: (id) => ipcRenderer.invoke('get-product-by-id', id),
  addProduct: (product) => ipcRenderer.invoke('add-product', product),
  updateProduct: (id, product) => ipcRenderer.invoke('update-product', id, product),
  deleteProduct: (id) => ipcRenderer.invoke('delete-product', id),
  updateStatus: (id, cliente, telefono, direccion, periodo, pago) => 
    ipcRenderer.invoke('update-status', id, cliente, telefono, direccion, periodo, pago),
  unlockProduct: (id) => ipcRenderer.invoke('unlock-product', id),
  addClient: (clientData) => ipcRenderer.invoke('add-client', clientData),
  getClients: () => ipcRenderer.invoke('get-clients'),
  getClientByDni: (dni) => ipcRenderer.invoke('get-client-by-dni', dni),
  deleteClient: (clientId) => ipcRenderer.invoke('delete-client', clientId),
  getPagosByProducto: (productoId) => ipcRenderer.invoke('get-pagos-by-producto', productoId),
  updatePago: (pagoId, data) => ipcRenderer.invoke('update-pago', pagoId, data),
  deletePagosByProducto: (productoId) => ipcRenderer.invoke("delete-pagos-by-producto", productoId),
  saveStatus: (id, data) => ipcRenderer.invoke("save-status", id, data),
  getIngresos: () => ipcRenderer.invoke('get-ingresos'),

  // ✅ Agregamos la función para reiniciar solo la UI
  restartApp: () => ipcRenderer.send('restart-app')
});
