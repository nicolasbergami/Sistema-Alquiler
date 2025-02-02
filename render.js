const productForm = document.getElementById('product-form');
const productTable = document.querySelector('#product-table tbody');
const productSummaryTable = document.querySelector('#product-summary-table tbody'); // Tabla de resumen
const searchInput = document.getElementById('searchInput'); // Campo de búsqueda

// Formulario de cambio de estado
const statusForm = document.getElementById('status-form');
const clienteInput = document.getElementById('cliente');
const telefonoInput = document.getElementById('telefono'); // Campo de teléfono
const direccionInput = document.getElementById('direccion'); // Campo de dirección
const periodoInput = document.getElementById('periodo');
const pagoInput = document.getElementById('pago'); // Campo de pago
const saveStatusButton = document.getElementById('save-status');
const cancelStatusButton = document.getElementById('cancel-status');
const clientSearchInput = document.getElementById('client-search');
const clientTableBody = document.querySelector('#client-table tbody');

let editingProductId = null;
let changingStatusId = null;
let allProducts = []; // Variable para almacenar todos los productos

document.addEventListener("DOMContentLoaded", () => {
  const periodoInput = document.getElementById('periodo');

  if (periodoInput) {
    flatpickr(periodoInput, {
      enableTime: false,
      dateFormat: "Y-m-d",
      mode: "range",
      minDate: "today",
    });
  } else {
    console.warn("⚠️ No se encontró el input con id='periodo'.");
  }
});


// Cargar los productos desde la API (ajusta según tu backend)
async function loadProducts() {
  console.log("🟢 Cargando productos...");
  try {
    const products = await window.api.getProducts();
    console.log("🔍 Productos obtenidos:", products); // <--- LOG IMPORTANTE
    if (!products || products.length === 0) {
      console.warn("⚠️ No se encontraron productos en la base de datos.");
    }
    allProducts = products || [];
    renderProducts(allProducts);
    renderProductSummary(allProducts);
  } catch (error) {
    console.error("❌ Error al cargar productos:", error);
  }
}

// Modificación de la función renderProducts
async function renderProducts(products) {
  productTable.innerHTML = ''; // Limpiar la tabla de productos antes de cargar nuevos productos

  // Agrupar productos por nombre
  const groupedProducts = products.reduce((groups, product) => {
    if (!groups[product.nombre]) {
      groups[product.nombre] = { ...product, detalles: [], cantidad: 0, estado: 'Disponible' };
    }
    groups[product.nombre].cantidad += product.cantidad;
    groups[product.nombre].detalles.push(product);

    // Determinar estado general del producto (Disponible o No Disponible)
    const unavailableCount = groups[product.nombre].detalles.filter(p => p.estado === 'No disponible').length;
    groups[product.nombre].estado = (unavailableCount === groups[product.nombre].cantidad) ? 'No disponible ❌ ' : 'Disponible 🟢';

    return groups;
  }, {});

  // Renderizar productos agrupados
  for (const productGroup of Object.values(groupedProducts)) {
    const generalSeparator = document.createElement('tr');
    generalSeparator.innerHTML = `<td colspan="11" style="border-bottom: 1px solid #ddd; padding: 5px 0;"></td>`;
    productTable.appendChild(generalSeparator);

    const row = document.createElement('tr');
    row.innerHTML = `
          <td>${productGroup.id}</td>
          <td>${productGroup.nombre}</td>
          <td>${productGroup.precio}</td>
          <td>${productGroup.cantidad}</td>
          <td>${productGroup.estado}</td>
          <td></td> <!-- Espacio vacío para Cliente -->
          <td></td> <!-- Espacio vacío para Teléfono -->
          <td></td> <!-- Espacio vacío para Periodo -->
          <td></td> <!-- Espacio vacío para Dirección -->
          <td></td> <!-- Espacio vacío para pago -->
          <td class="action-buttons">
              <button class="details" onclick="toggleDetails('${productGroup.nombre}')" style="background-color: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 3px;">Ver Detalles</button>
              <button class="edit-all" onclick="openEditAllModal('${productGroup.nombre}')" style="background-color: #ffc107; color: black; border: none; padding: 5px 10px; border-radius: 3px;">Editar Todos</button>
              <button class="delete-all" onclick="deleteAllProducts('${productGroup.nombre}')" style="background-color: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px;">Eliminar Todos</button>
              <button class="add-product" onclick="addGeneralProduct('${productGroup.nombre}', ${productGroup.precio})" style="background-color: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 3px;">Agregar</button>
          </td>
      `;
    productTable.appendChild(row);

    // Agregar separador entre grupo general y detalles
    const separatorRow = document.createElement('tr');
    separatorRow.innerHTML = `<td colspan="11" style="border-top: 1px solid #ddd; padding: 5px 0;"></td>`;
    productTable.appendChild(separatorRow);

    // Renderizar productos individuales y sus pagos
    for (const detail of productGroup.detalles) {
      // Obtener pagos desde la base de datos
      const pagos = await window.api.getPagosByProducto(detail.id);
      console.log(`Pagos del producto ${detail.id}:`, pagos); // 🔍 Verifica en consola

      // Verificar si hay pagos pendientes
      const tienePagosPendientes = pagos.some(pago => pago.estado_pago !== 'pagado');
      let estadoPago = '';
      if (detail.estado === 'No disponible') {
        estadoPago = tienePagosPendientes ? '❌ Debe Pagos' : '✅ Pagado';
      }

      const detailRow = document.createElement('tr');
      detailRow.classList.add('product-details', 'hidden');
      detailRow.setAttribute('data-product-name', productGroup.nombre);
      detailRow.innerHTML = `
          <td>${detail.id}</td>
          <td>${detail.nombre}</td>
          <td>${detail.precio}</td>
          <td>${detail.cantidad}</td>
          <td>${detail.estado}</td>
          <td>${detail.cliente || ''}</td>
          <td>${detail.telefono || ''}</td>
          <td> ${detail.periodo || ''}</td>
          <td>${detail.direccion || ''}</td>
          <td>${estadoPago}</td> <!-- ✅ Nueva validación de pagos -->
          <td class="action-buttons">
              <button class="edit" onclick="editProduct(${detail.id})">Editar</button>
              <button class="delete" onclick="deleteProduct(${detail.id})">Eliminar</button>
              <button class="status" onclick="openStatusForm(${detail.id})">Alquilar</button>
              <button class="unlock" onclick="unlockProduct(${detail.id})">Devolver</button>
              <button class="view-payments" onclick="togglePagos(${detail.id})">Pagos</button>
          </td>
      `;
      productTable.appendChild(detailRow);

      // Fila para mostrar pagos mensuales del préstamo
      const pagosRow = document.createElement('tr');
      pagosRow.classList.add('hidden');
      pagosRow.id = `pagos-${detail.id}`;
      pagosRow.innerHTML = `<td colspan="11"><div id="pagos-list-${detail.id}"></div></td>`;
      productTable.appendChild(pagosRow);
    }
  }
}


// Mostrar los pagos del producto
async function togglePagos(productId) {
  console.log("Abriendo pagos para producto ID:", productId);

  try {
    const pagos = await window.api.getPagosByProducto(productId);
    console.log("Pagos obtenidos:", pagos);

    if (!pagos.length) {
      alert("No hay pagos registrados para este producto.");
      return;
    }

    const existingModal = document.getElementById("pagos-modal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.id = "pagos-modal";
    modal.className = "modal";
    modal.innerHTML = `
          <div class="modal-content">
              <h2>Estado de Pagos</h2>
              <table id="pagos-table">
                  <thead>
                      <tr>
                          <th>Mes</th>
                          <th>Estado</th>
                          <th>Acción</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${pagos.map(pago => `
                          <tr>
                              <td>${pago.mes}</td>
                              <td>${pago.estado_pago === 'pagado' ? '✅ Pagado' : '❌ Debe'}</td>
                              <td>
                                  <button onclick="marcarComoPagado(${pago.id}, ${productId})" 
                                      ${pago.estado_pago === 'pagado' ? 'disabled' : ''}>
                                      ${pago.estado_pago === 'pagado' ? '✔️' : '💰 Pagar'}
                                  </button>
                              </td>
                          </tr>
                      `).join('')}
                  </tbody>
              </table>
              <button onclick="closePagosModal()">Cerrar</button>
          </div>
      `;

    modal.style.position = "fixed";
    modal.style.top = "50%";
    modal.style.left = "50%";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.background = "#fff";
    modal.style.padding = "20px";
    modal.style.boxShadow = "0px 4px 8px rgba(0,0,0,0.2)";
    modal.style.borderRadius = "10px";
    modal.style.zIndex = "1000";

    document.body.appendChild(modal);

  } catch (error) {
    console.error("Error al obtener pagos:", error);
  }
}


// ✅ Función para marcar un mes como pagado
async function marcarComoPagado(pagoId, productId) {
  try {
    await window.api.updatePago(pagoId, { estado_pago: 'pagado' });

    alert("Pago registrado correctamente.");

    // 🔄 Recargar el modal de pagos
    togglePagos(productId);

    // 🔄 Recargar los productos para actualizar la columna "Pago"
    loadProducts();
  } catch (error) {
    console.error("Error al marcar pago:", error);
  }
}


// ❌ Función para cerrar el modal
function closePagosModal() {
  const modal = document.getElementById("pagos-modal");
  if (modal) modal.remove();
}





// Función para mostrar u ocultar los detalles de un grupo de productos
function toggleDetails(productName) {
  const detailRows = document.querySelectorAll(`.product-details[data-product-name="${productName}"]`);
  detailRows.forEach((detailRow) => {
    detailRow.classList.toggle('hidden');
  });
}

// Función para agregar un producto general al grupo
async function addGeneralProduct(productName, productPrice) {
  try {
    await window.api.addProduct({
      nombre: productName,
      precio: productPrice,
      cantidad: 1,
      estado: 'Disponible',
    });
    loadProducts(); // Recargar productos después de agregar
  } catch (error) {
    console.error('Error al agregar el producto:', error);
  }
}

// Función para abrir un modal para editar todos los productos de un grupo
function openEditAllModal(productName) {
  // Obtener los datos actuales del grupo
  const details = document.querySelectorAll(`.product-details[data-product-name="${productName}"]`);
  if (details.length === 0) return;

  // Usar los datos del primer producto del grupo como referencia
  const firstProduct = details[0].querySelectorAll('td');
  const currentName = firstProduct[1].innerText;
  const currentPrice = firstProduct[2].innerText;

  // Crear modal dinámico
  const modal = document.createElement('div');
  modal.id = 'editAllModal';
  modal.innerHTML = `
      <div class="modal-content">
          <h2>Editar Todos los Productos (${productName})</h2>
          <form id="editAllForm">
              <label for="editName">Nombre:</label>
              <input type="text" id="editName" value="${currentName}" required>

              <label for="editPrice">Precio:</label>
              <input type="number" id="editPrice" value="${currentPrice}" required>

              <button type="submit">Guardar</button>
              <button type="button" onclick="closeEditAllModal()">Cancelar</button>
          </form>
      </div>
  `;

  modal.classList.add('modal');
  document.body.appendChild(modal);

  // Manejar la edición al enviar el formulario
  const form = document.getElementById('editAllForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newName = document.getElementById('editName').value;
    const newPrice = parseFloat(document.getElementById('editPrice').value);

    // Actualizar cada producto individualmente
    for (const detailRow of details) {
      const productId = detailRow.querySelector(".edit").getAttribute("onclick").match(/\d+/)[0];
      await window.api.updateProduct(productId, {
        nombre: newName,
        precio: newPrice,
      });
    }

    closeEditAllModal(); // Cerrar el modal
    loadProducts(); // Recargar productos después de editar
  });
}

// Función para cerrar el modal de edición
function closeEditAllModal() {
  const modal = document.getElementById('editAllModal');
  if (modal) {
    modal.remove();
  }
}

// Función para eliminar todos los productos de un grupo
function deleteAllProducts(productName) {
  if (confirm(`¿Estás seguro de que deseas eliminar todos los productos del grupo "${productName}"?`)) {
    const details = document.querySelectorAll(`.product-details[data-product-name="${productName}"]`);
    details.forEach((detailRow) => {
      const productId = detailRow.querySelector(".delete").getAttribute("onclick").match(/\d+/)[0];
      deleteProduct(productId);
    });
    loadProducts(); // Recargar productos después de eliminar
  }
}


// Renderizar resumen de productos
function renderProductSummary(products) {
  productSummaryTable.innerHTML = ''; // Limpiar la tabla de resumen

  // Crear un objeto para llevar la contabilidad de las cantidades de cada producto
  const productCounts = {};

  products.forEach((product) => {
    // Contabilizar la cantidad de productos por nombre
    if (productCounts[product.nombre]) {
      productCounts[product.nombre] += product.cantidad;
    } else {
      productCounts[product.nombre] = product.cantidad;
    }
  });

  // Actualizar la tabla de resumen con las cantidades totales por producto
  Object.keys(productCounts).forEach((productName) => {
    const summaryRow = document.createElement('tr');
    summaryRow.innerHTML = `
      <td class="accordion-toggle" data-product-name="${productName}">${productName}</td>
      <td>${productCounts[productName]}</td>
    `;
    productSummaryTable.appendChild(summaryRow);
  });

  // Agregar evento de clic a las filas de resumen para desplegar productos
  document.querySelectorAll('.accordion-toggle').forEach(row => {
    row.addEventListener('click', (event) => {
      const productName = event.target.getAttribute('data-product-name');
      toggleProductDetails(productName);
    });
  });
}

// Función para buscar productos
function searchProducts() {
  const searchTerm = searchInput.value.toLowerCase();
  const filteredProducts = allProducts.filter(product =>
    product.nombre.toLowerCase().includes(searchTerm)
  );
  renderProducts(filteredProducts);
}

// Función para filtrar y ordenar productos por vencimiento
function filterByExpiration() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Ignorar horas, minutos, segundos

  const productsWithDaysLeft = allProducts.map(product => {
    if (product.periodo) {
      const periodo = product.periodo.split(' to ');
      const endDate = new Date(periodo[1]);
      endDate.setHours(0, 0, 0, 0); // Ignorar horas, minutos, segundos

      // Calcular la diferencia en días
      const timeDiff = endDate - today;
      const daysLeft = timeDiff / (1000 * 60 * 60 * 24);

      return { ...product, daysLeft };
    }
    return { ...product, daysLeft: Infinity }; // Si no tiene periodo, lo ponemos al final
  });

  // Filtrar productos que tienen un periodo de vencimiento definido
  const filteredProducts = productsWithDaysLeft.filter(product => product.daysLeft !== Infinity);

  // Ordenar los productos por la fecha más cercana a la fecha actual
  filteredProducts.sort((a, b) => a.daysLeft - b.daysLeft);

  console.log("Productos filtrados y ordenados:", filteredProducts);
  renderProducts(filteredProducts);
}

// Función para listar todos los productos sin ningún filtro
function listarProductos() {
  renderProducts(allProducts);
}

// Función para desplegar productos en la tabla de resumen
function toggleProductDetails(productName) {
  const productRows = document.querySelectorAll(`#product-table tbody tr`);
  productRows.forEach(row => {
    if (row.querySelector('td:nth-child(2)').innerText === productName) {
      row.classList.toggle('hidden');
    }
  });
}

// Agregar o editar producto
productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('nombre').value;
  const precio = document.getElementById('precio').value;
  const cantidad = parseInt(document.getElementById('cantidad').value, 10);

  console.log("Formulario enviado", { nombre, precio, cantidad }); // Verificar datos del formulario

  if (editingProductId === null) {
    // Si no estamos editando un producto, creamos uno nuevo
    for (let i = 0; i < cantidad; i++) {
      const product = { nombre, precio, cantidad: 1 };
      await window.api.addProduct(product);
    }
  } else {
    // Si estamos editando un producto, actualizamos el producto
    const product = { nombre, precio, cantidad };
    await window.api.updateProduct(editingProductId, product);
    editingProductId = null; // Resetear la variable para no seguir en modo de edición
  }

  loadProducts(); // Recargar productos después de agregar o editar

  // Limpiar el formulario después de cargar los productos
  productForm.reset();
});

// Editar producto
async function editProduct(id) {
  console.log("Editando producto con ID:", id); // Verificar si el ID de producto es correcto
  try {
    editingProductId = id;
    const product = await window.api.getProductById(id);
    if (!product) {
      console.error('Producto no encontrado');
      return;
    }
    console.log("Producto a editar:", product); // Verificar datos del producto
    document.getElementById('nombre').value = product.nombre;
    document.getElementById('precio').value = product.precio;
    document.getElementById('cantidad').value = product.cantidad;
    document.getElementById('cliente').value = product.cliente || '';
    document.getElementById('telefono').value = product.telefono || '';
    document.getElementById('direccion').value = product.direccion || '';
    document.getElementById('periodo').value = product.periodo || '';
    document.getElementById('pago').checked = product.pago || false;
  } catch (error) {
    console.error('Error al editar el producto:', error);
  }
}

// Eliminar producto
async function deleteProduct(id) {
  console.log("Eliminando producto con ID:", id); // Verificar ID de producto a eliminar
  await window.api.deleteProduct(id);
  loadProducts();
}

// Abrir el formulario para cambiar el estado del producto
function openStatusForm(id) {
  changingStatusId = id;
  statusForm.classList.remove('hidden');
}

// Guardar el estado cambiado
saveStatusButton.addEventListener('click', async () => {
  const dni = document.getElementById('cliente-dni').value.trim();
  const nombre = document.getElementById('cliente').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const direccion = document.getElementById('direccion').value.trim();
  const inicioMes = inicioMesSelect.value;
  const finMes = finMesSelect.value;
  const pago = pagoInput.checked;

  console.log("🟢 Enviando datos para actualizar estado:", {
    dni, nombre, telefono, direccion, inicioMes, finMes, pago, changingStatusId
  });

  // 🔴 Si algún campo está vacío, mostramos un error y detenemos el guardado.
  if (!dni || !nombre || !telefono || !direccion || !inicioMes || !finMes) {
    alert('⚠️ Por favor, completa todos los datos antes de guardar.');
    return;
  }

  try {
    await window.api.updateStatus(changingStatusId, {
      cliente: nombre,
      telefono,
      direccion,
      inicioMes,
      finMes,
      pago,
    });

    console.log('✅ Estado actualizado correctamente.');
    loadProducts(); // Recargar la tabla de productos después de actualizar
    closeStatusForm(); // Cerrar el formulario
  } catch (error) {
    console.error('❌ Error al guardar la reserva:', error);
  }
});


// Cancelar cambio de estado
cancelStatusButton.addEventListener('click', closeStatusForm);

// Cerrar formulario de estado
function closeStatusForm() {
  statusForm.classList.add('hidden');
  clienteInput.value = '';
  telefonoInput.value = ''; // Limpiar el campo de teléfono
  direccionInput.value = ''; // Limpiar el campo de dirección
  periodoInput.value = '';
  pagoInput.checked = false; // Limpiar el campo de pago
}

// Desbloquear producto
async function unlockProduct(id) {
  console.log("🔄 Devolviendo producto con ID:", id); // Depuración

  try {
    // 🔥 Eliminar todos los pagos asociados a este producto
    await window.api.deletePagosByProducto(id);
    console.log(`✅ Todos los pagos del producto ${id} han sido eliminados.`);

    // 🔄 Actualizar el estado del producto en la base de datos
    await window.api.updateProduct(id, {
      estado: 'Disponible',
      cliente: '',
      telefono: '',
      direccion: '',
      periodo: '',
      pago: false // Asegurar que no quede marcado como pagado
    });

    console.log(`✅ Producto ${id} devuelto y actualizado a Disponible.`);
    loadProducts(); // Recargar la tabla de productos para reflejar cambios
  } catch (error) {
    console.error("❌ Error al devolver el producto:", error);
    alert("Hubo un problema al devolver el producto. Intenta nuevamente.");
  }
}

document.getElementById('add-client-btn').addEventListener('click', () => {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'add-client-modal';

  modal.innerHTML = `
      <div class="modal-content">
          <h2>Agregar Cliente</h2>
          <form id="add-client-form">
              <label>Nombre:</label>
              <input type="text" id="cliente-nombre" required>
              <label>Dirección:</label>
              <input type="text" id="cliente-direccion" required>
              <label> DNI:</label>
              <input type="text" id="dni" required>
              <label>Teléfono:</label>
              <input type="text" id="cliente-telefono" required>
              <label>Nombre del Garante:</label>
              <input type="text" id="garante-nombre" required>
              <label>Teléfono del Garante:</label>
              <input type="text" id="garante-telefono" required>
              <button type="submit">Guardar</button>
              <button type="button" id="cancel-client-btn">Cancelar</button>
          </form>
      </div>
  `;

  document.body.appendChild(modal);

  // **Esperar a que el DOM cargue completamente antes de capturar el evento**
  setTimeout(() => {
    const form = document.getElementById('add-client-form');
    if (!form) {
      console.error("❌ No se encontró el formulario en el modal.");
      return;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const dniInput = document.getElementById('dni');
      console.log("Valor del DNI:", dniInput.value);
      if (!dniInput || dniInput.value.trim() === "") {
        alert("❌ Error: El DNI es obligatorio.");
        console.error("❌ Error: No se capturó el DNI correctamente.");
        return;
      }

      const clientData = {
        nombre: document.getElementById('cliente-nombre').value.trim(),
        direccion: document.getElementById('cliente-direccion').value.trim(),
        dni: document.getElementById('dni').value.trim(),
        telefono: document.getElementById('cliente-telefono').value.trim(),
        garante_nombre: document.getElementById('garante-nombre').value.trim(),
        garante_telefono: document.getElementById('garante-telefono').value.trim(),
      };

      console.log("📤 Enviando cliente al backend:", clientData);

      try {
        await window.api.addClient(clientData);
        alert("✅ Cliente agregado correctamente.");
        document.body.removeChild(modal);
        loadClients(); // Recargar la tabla de clientes
      } catch (error) {
        console.error("❌ Error al agregar cliente en frontend:", error);
        alert("❌ Error al agregar el cliente.");
      }
    });

    document.getElementById('cancel-client-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

  }, 100); // 🔴 Espera 100ms para asegurar que el modal está cargado antes de agregar eventos
});


document.getElementById('cliente-dni').addEventListener('blur', async () => {
  const dni = document.getElementById('cliente-dni').value;
  if (!dni) return;

  try {
    // Llamada al backend para obtener datos del cliente
    const client = await window.api.getClientByDni(dni);

    if (client) {
      // Completar los campos del formulario automáticamente
      document.getElementById('cliente').value = client.nombre;
      document.getElementById('telefono').value = client.telefono;
      document.getElementById('direccion').value = client.direccion;

      console.log('Cliente encontrado:', client);
    } else {
      alert('Cliente no encontrado. Por favor, verifica el DNI.');
      document.getElementById('cliente').value = '';
      document.getElementById('telefono').value = '';
      document.getElementById('direccion').value = '';
    }
  } catch (error) {
    console.error('Error al buscar el cliente:', error);
  }
});



// Número de clientes por página
const clientsPerPage = 10;

// Función para cargar los clientes con paginación
async function loadClients(page = 1) {
  try {
    console.log("📥 Solicitando clientes desde la API...");
    const clients = await window.api.getClients(); // Obtenemos los clientes
    allClients = clients; // Guardamos los clientes en la variable global

    if (!clients || !Array.isArray(clients) || clients.length === 0) {
      console.warn("⚠️ No hay clientes en la base de datos.");
      renderClients([], 1); // Si no hay clientes, se renderiza la tabla vacía
      return;
    }

    renderClients(clients, page); // Renderizamos los clientes para la página solicitada
  } catch (error) {
    console.error("❌ Error al cargar los clientes:", error);
  }
}

// Función para renderizar los clientes con paginación
function renderClients(clients, page = 1) {
  const tbody = document.getElementById('cliente-table').querySelector('tbody');
  tbody.innerHTML = ''; // Limpiar la tabla antes de renderizar

  // Calcular los índices de paginación
  const startIndex = (page - 1) * clientsPerPage;
  const endIndex = startIndex + clientsPerPage;
  const paginatedClients = clients.slice(startIndex, endIndex); // Seleccionar los clientes para la página

  paginatedClients.forEach(client => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${client.id}</td>
      <td>${client.nombre}</td>
      <td>${client.direccion}</td>
      <td>${client.dni}</td>
      <td>${client.telefono}</td>
      <td>${client.garante_nombre} (${client.garante_telefono})</td>
      <td>
        <button onclick="editClient(${client.id})">Editar</button>
        <button onclick="deleteClient(${client.id})">Eliminar</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  renderPaginationControls(clients.length, page); // Renderizamos los controles de paginación
}

// Función para renderizar los controles de paginación
function renderPaginationControls(totalClients, currentPage) {
  const paginationContainer = document.getElementById('pagination-controls');
  paginationContainer.innerHTML = ''; // Limpiar contenido previo

  const totalPages = Math.ceil(totalClients / clientsPerPage); // Calcular el número total de páginas

  // Crear un botón por cada página
  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement('button');
    button.innerText = i;
    button.classList.add('pagination-btn');
    if (i === currentPage) button.classList.add('active'); // Resaltar la página actual

    button.addEventListener('click', () => {
      renderClients(allClients, i); // Llamar a la función renderClients cuando se hace clic en un botón
    });

    paginationContainer.appendChild(button); // Añadir el botón al contenedor de paginación
  }
}





document.getElementById('restart-app').addEventListener('click', () => {
  console.log("🔄 Enviando solicitud para reiniciar la aplicación...");
  window.api.restartApp(); // Llama al método expuesto en preload.js
});




document.getElementById('load-client-data').addEventListener('click', async () => {
  const dni = document.getElementById('cliente-dni').value;
  console.log('DNI ingresado para búsqueda:', dni); // Verifica el DNI ingresado

  if (!dni) {
    alert('Por favor, ingresa un DNI válido.');
    return;
  }

  try {
    const client = await window.api.getClientByDni(dni);
    console.log('Cliente recibido:', client); // Verifica si el cliente fue recibido

    if (client) {
      document.getElementById('cliente').value = client.nombre;
      document.getElementById('telefono').value = client.telefono;
      document.getElementById('direccion').value = client.direccion;
      alert('Datos cargados correctamente.');
    } else {
      alert('Cliente no encontrado. Por favor, verifica el DNI.');
    }
  } catch (error) {
    console.error('Error al buscar el cliente:', error);
    alert('Ocurrió un error al buscar el cliente. Intenta de nuevo.');
  }
});

// Evento para buscar clientes
// Evento para buscar clientes
clientSearchInput.addEventListener('input', () => {
  const searchTerm = clientSearchInput.value.toLowerCase();

  // Filtrar los clientes que coincidan con el término de búsqueda
  const filteredClients = allClients.filter(client =>
    client.nombre.toLowerCase().includes(searchTerm) ||
    client.telefono.toLowerCase().includes(searchTerm) ||
    client.dni.toLowerCase().includes(searchTerm)
  );

  // Renderizar la tabla con los clientes filtrados
  renderClients(filteredClients);
});



async function deleteClient(clientId) {
  if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
    try {
      // Llamada al backend para eliminar al cliente
      await window.api.deleteClient(clientId);

      // Actualizar la lista de clientes después de eliminar
      alert('Cliente eliminado correctamente.');
      loadClients(); // Recargar la tabla de clientes
    } catch (error) {
      console.error('Error al eliminar el cliente:', error);
      alert('Ocurrió un error al intentar eliminar al cliente.');
    }
  }
}
const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const inicioMesSelect = document.getElementById("inicio-mes");
const finMesSelect = document.getElementById("fin-mes");

// Generar opciones de meses
meses.forEach((mes, index) => {
  const option1 = new Option(mes, index + 1);
  const option2 = new Option(mes, index + 1);
  inicioMesSelect.add(option1);
  finMesSelect.add(option2);
});

document.getElementById("view-income-btn").addEventListener("click", async () => {
  console.log("📊 Solicitando ingresos...");

  try {
    const ingresos = await window.api.getIngresos();
    console.log("✅ Ingresos obtenidos:", ingresos);

    const incomeTableBody = document.getElementById("income-table-body");
    incomeTableBody.innerHTML = "";

    ingresos.forEach(ingreso => {
      const row = document.createElement("tr");
      row.innerHTML = `
              <td>${ingreso.periodo}</td>
              <td>$${ingreso.total_ingresos.toFixed(2)}</td>
          `;
      incomeTableBody.appendChild(row);
    });

    document.getElementById("income-modal").classList.remove("hidden");

  } catch (error) {
    console.error("❌ Error al obtener ingresos:", error);
    alert("Error al cargar los ingresos. Intenta de nuevo.");
  }
});

// Función para cerrar el modal
function closeIncomeModal() {
  document.getElementById("income-modal").classList.add("hidden");
}




// Cargar productos al inicio
loadProducts();

// Cargar clientes automáticamente en intervalos regulares

document.addEventListener('DOMContentLoaded', () => {
  loadClients(1); // Cargar los clientes en la primera página al inicio
});
