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

let editingProductId = null;
let changingStatusId = null;
let allProducts = []; // Variable para almacenar todos los productos

// Inicializar Flatpickr para el campo periodo (rango de fechas)
flatpickr(periodoInput, {
  enableTime: false,
  dateFormat: "Y-m-d",
  mode: "range", // Permite seleccionar un rango de fechas
  minDate: "today", // Fecha mínima para la selección
});

// Cargar los productos desde la API (ajusta según tu backend)
async function loadProducts() {
  console.log("Cargando productos...");  // Paso de depuración para verificar que la función se ejecuta
  try {
    const products = await window.api.getProducts(); // Ajusta según tu API
    console.log("Productos obtenidos:", products); // Verificar los productos que se obtienen de la API
    allProducts = products; // Almacenar todos los productos en la variable global

    renderProducts(products); // Renderizar productos
    renderProductSummary(products); // Renderizar resumen de productos

  } catch (error) {
    console.error("Error al cargar los productos:", error);
  }
}

// Modificación de la función renderProducts
function renderProducts(products) {
  productTable.innerHTML = ''; // Limpiar la tabla de productos antes de cargar nuevos productos

  // Agrupar productos por nombre
  const groupedProducts = products.reduce((groups, product) => {
    if (!groups[product.nombre]) {
      groups[product.nombre] = { ...product, detalles: [], cantidad: 0, estado: 'Disponible' }; // Estado inicial ajustado a "Disponible"
    }
    groups[product.nombre].cantidad += product.cantidad;
    groups[product.nombre].detalles.push(product);

    // Determinar estado general: Si la cantidad de productos "No disponible" es igual a la cantidad total, el estado es "No disponible"
    const unavailableCount = groups[product.nombre].detalles.filter(p => p.estado === 'No disponible').length;
    if (unavailableCount === groups[product.nombre].cantidad) {
      groups[product.nombre].estado = 'No disponible';
    } else {
      groups[product.nombre].estado = 'Disponible';
    }

    return groups;
  }, {});

  // Renderizar productos agrupados

  Object.values(groupedProducts).forEach((productGroup) => {
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


    // Fila oculta para los detalles de los productos
    productGroup.detalles.forEach((detail) => {
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
              <td>${detail.periodo || ''}</td>
              <td>${detail.direccion || ''}</td>
              <td>${detail.pago ? 'Sí' : 'No'}</td>
              <td class="action-buttons">
                  <button class="edit" onclick="editProduct(${detail.id})">Editar</button>
                  <button class="delete" onclick="deleteProduct(${detail.id})">Eliminar</button>
                  <button class="status" onclick="openStatusForm(${detail.id})">Alquilar</button>
                  <button class="unlock" onclick="unlockProduct(${detail.id})">Devolver</button>
              </td>
          `;

      productTable.appendChild(detailRow);
    });
  });
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
  const cliente = clienteInput.value;
  const telefono = telefonoInput.value; // Obtener el valor del campo de teléfono
  const direccion = direccionInput.value; // Obtener el valor del campo de dirección
  const periodo = periodoInput.value;
  const pago = pagoInput.checked; // Obtener el valor del campo de pago

  console.log("Guardando estado con cliente:", cliente, "teléfono:", telefono, "dirección:", direccion, "periodo:", periodo, "pago:", pago); // Verificar datos del formulario

  await window.api.updateStatus(changingStatusId, cliente, telefono, direccion, periodo, pago);
  loadProducts();
  closeStatusForm();
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
  console.log("Desbloqueando producto con ID:", id); // Verificar desbloqueo
  // Actualizar cliente, teléfono, periodo, dirección y estado en la base de datos
  await window.api.updateProduct(id, {
    estado: 'Disponible',
    cliente: '',
    telefono: '', // Limpiar el campo de teléfono
    direccion: '', // Limpiar el campo de dirección
    periodo: '',
    pago: false // Limpiar el campo de pago
  });

  // Recargar productos para reflejar los cambios en la tabla
  loadProducts();
}

// Cargar productos al inicio
loadProducts();