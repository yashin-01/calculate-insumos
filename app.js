// ================================================
// CALCULADORA DE INSUMOS - APLICACIÓN COMPLETA
// Responsive para móviles, tablets y PC
// ================================================

// SweetAlert2 Toast configuration
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

// ========================================
// CONFIGURACIÓN Y ESTADO GLOBAL
// ========================================

const defaultConfig = {
    productos: {
        harina: { nombre: 'Harina', precio: 1500, cantidadRef: 1000, unidad: 'gr' },
        azucar: { nombre: 'Azúcar', precio: 1200, cantidadRef: 1000, unidad: 'gr' },
        huevos: { nombre: 'Huevos', precio: 2000, cantidadRef: 10, unidad: 'unidad' },
        mantequilla: { nombre: 'Mantequilla', precio: 3500, cantidadRef: 500, unidad: 'gr' },
        leche: { nombre: 'Leche', precio: 1000, cantidadRef: 1000, unidad: 'ml' },
        levadura: { nombre: 'Levadura', precio: 800, cantidadRef: 100, unidad: 'gr' },
        aceite: { nombre: 'Aceite', precio: 2000, cantidadRef: 1000, unidad: 'ml' },
        sal: { nombre: 'Sal', precio: 500, cantidadRef: 1000, unidad: 'gr' }
    },
    gas: {
        precio: 20000,
        kg: 15,
        factor: 0.20  // kg/h
    }
};

let config = { ...defaultConfig };
let productosPersonalizados = {};
let productosSeleccionados = {};
let usosGas = [];
let recetaHistorial = [];

// ========================================
// UTILIDADES
// ========================================

// Formatear número a CLP (pesos chilenos con puntos)
function formatearCLP(numero) {
    return '$' + Math.round(numero).toLocaleString('es-CL');
}

// Parsear número desde formato CLP
function parsearCLP(texto) {
    return parseFloat(texto.replace(/[$.]/g, ''));
}

// Vaclidar número positivo
function validarNumeroPositivo(valor, nombre) {
    const num = parseFloat(valor);
    if (isNaN(num) || num < 0) {
        Toast.fire({
            icon: 'error',
            title: `${nombre} debe ser un número positivo`
        });
        return false;
    }
    return true;
}

// Validar temperatura
function validarTemperatura(temp) {
    const t = parseFloat(temp);
    if (isNaN(t) || t < 0 || t > 300) {
        Toast.fire({
            icon: 'error',
            title: 'La temperatura debe estar entre 0 y 300°C'
        });
        return false;
    }
    return true;
}

// ========================================
// ALMACENAMIENTO (LocalStorage)
// ========================================

function guardarConfiguracion() {
    try {
        const dataToSave = {
            ...config,
            ultimaActualizacion: new Date().toISOString().split('T')[0]
        };
        localStorage.setItem('bakeryCalculatorConfig', JSON.stringify(dataToSave));
        localStorage.setItem('bakeryCalculatorCustomProducts', JSON.stringify(productosPersonalizados));
        localStorage.setItem('bakeryCalculatorHistory', JSON.stringify(recetaHistorial));
        console.log('✅ Configuración guardada');
    } catch (error) {
        console.error('Error al guardar configuración:', error);
        Toast.fire({
            icon: 'error',
            title: 'Error al guardar la configuración'
        });
    }
}

function cargarConfiguracion() {
    try {
        const savedConfig = localStorage.getItem('bakeryCalculatorConfig');
        const savedCustomProducts = localStorage.getItem('bakeryCalculatorCustomProducts');
        const savedHistory = localStorage.getItem('bakeryCalculatorHistory');

        if (savedConfig) {
            config = { ...defaultConfig, ...JSON.parse(savedConfig) };
        }

        if (savedCustomProducts) {
            productosPersonalizados = JSON.parse(savedCustomProducts);
        }

        if (savedHistory) {
            recetaHistorial = JSON.parse(savedHistory);
            console.log('📚 Historial cargado desde localStorage:', recetaHistorial);
        }

        console.log('✅ Configuración cargada');
    } catch (error) {
        console.error('Error al cargar configuración:', error);
        config = { ...defaultConfig };
    }
}

function exportarConfiguracion() {
    try {
        const dataToExport = {
            config,
            productosPersonalizados,
            fecha: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `calculadora-insumos-config-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Toast.fire({
            icon: 'success',
            title: 'Configuración exportada'
        });
    } catch (error) {
        console.error('Error al exportar:', error);
        Toast.fire({
            icon: 'error',
            title: 'Error al exportar la configuración'
        });
    }
}

function importarConfiguracion(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);

            // Validar estructura
            if (!data.config || !data.config.productos || !data.config.gas) {
                throw new Error('Estructura de archivo inválida');
            }

            config = data.config;
            productosPersonalizados = data.productosPersonalizados || {};

            guardarConfiguracion();
            renderProductos();
            actualizarPrecioGas();

            Toast.fire({
                icon: 'success',
                title: 'Configuración importada correctamente'
            });
        } catch (error) {
            console.error('Error al importar:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error al importar',
                text: 'El archivo no tiene un formato válido',
                background: '#1a1f2e',
                color: '#f8fafc'
            });
        }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset input
}

// ========================================
// RENDERIZADO DE PRODUCTOS
// ========================================

function renderProductos() {
    const productsList = document.getElementById('productsList');
    productsList.innerHTML = '';

    // Productos base
    Object.entries(config.productos).forEach(([key, producto]) => {
        productsList.appendChild(crearProductoHTML(key, producto, false));
    });

    // Productos personalizados
    Object.entries(productosPersonalizados).forEach(([key, producto]) => {
        productsList.appendChild(crearProductoHTML(key, producto, true));
    });
}

function crearProductoHTML(key, producto, esPersonalizado) {
    const div = document.createElement('div');
    div.className = 'product-item';
    div.id = `product-${key}`;

    const precioFormateado = formatearCLP(producto.precio);
    const unidadDisplay = producto.unidad === 'unidad' ? 'unidad' : `${producto.cantidadRef}${producto.unidad}`;

    div.innerHTML = `
        <div class="product-header">
            <input type="checkbox" class="product-checkbox" id="check-${key}" onchange="toggleProducto('${key}', this.checked)">
            <label for="check-${key}" class="product-name">${producto.nombre}</label>
            ${esPersonalizado ? `<button class="btn-delete" onclick="eliminarProductoPersonalizado('${key}')">🗑️</button>` : ''}
        </div>
        <div class="product-price-display">
            <span>${precioFormateado}/${unidadDisplay}</span>
            <button class="btn-edit" onclick="editarPrecioProducto('${key}', ${esPersonalizado})">
                <span class="icon">✏️</span>
                <span>Editar</span>
            </button>
        </div>
        <div class="product-quantity">
            <input type="number" 
                   id="qty-${key}" 
                   placeholder="Cantidad (${producto.unidad})" 
                   min="0" 
                   step="any"
                   disabled
                   onfocus="this.select()"
                   oninput="actualizarCantidadProducto('${key}')">
        </div>
    `;

    return div;
}

function toggleProducto(key, checked) {
    const qtyInput = document.getElementById(`qty-${key}`);
    qtyInput.disabled = !checked;

    if (!checked) {
        qtyInput.value = '';
        delete productosSeleccionados[key];
    } else {
        // Si se marca, agregar con la cantidad actual (o 0 si está vacío)
        const cantidad = parseFloat(qtyInput.value) || 0;
        if (cantidad > 0) {
            productosSeleccionados[key] = cantidad;
        }
    }

    actualizarResumen();
}

// Función para actualizar cantidad en productosSeleccionados
function actualizarCantidadProducto(key) {
    const qtyInput = document.getElementById(`qty-${key}`);
    const cantidad = parseFloat(qtyInput.value) || 0;

    if (cantidad > 0) {
        productosSeleccionados[key] = cantidad;
    } else {
        delete productosSeleccionados[key];
    }

    actualizarResumen();
}

async function editarPrecioProducto(key, esPersonalizado) {
    const productos = esPersonalizado ? productosPersonalizados : config.productos;
    const producto = productos[key];

    const { value: formValues } = await Swal.fire({
        title: `Editar ${producto.nombre}`,
        html: `
            <div style="text-align: left; margin: 1rem 0;">
                <label style="display: block; margin-bottom: 0.5rem; color: #cbd5e1;">Precio:</label>
                <input id="swal-precio" class="swal2-input" type="number" value="${producto.precio}" style="margin-top: 0;" onfocus="this.select()">
                
                <label style="display: block; margin: 1rem 0 0.5rem; color: #cbd5e1;">Cantidad de referencia:</label>
                <input id="swal-cantRef" class="swal2-input" type="number" value="${producto.cantidadRef}" style="margin-top: 0;" onfocus="this.select()">
                
                <label style="display: block; margin: 1rem 0 0.5rem; color: #cbd5e1;">Unidad:</label>
                <input id="swal-unidad" class="swal2-input" type="text" value="${producto.unidad}" style="margin-top: 0;" onfocus="this.select()">
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        background: '#1a1f2e',
        color: '#f8fafc',
        preConfirm: () => {
            return {
                precio: document.getElementById('swal-precio').value,
                cantidadRef: document.getElementById('swal-cantRef').value,
                unidad: document.getElementById('swal-unidad').value
            }
        }
    });

    if (formValues) {
        if (!validarNumeroPositivo(formValues.precio, 'Precio')) return;
        if (!validarNumeroPositivo(formValues.cantidadRef, 'Cantidad de referencia')) return;

        producto.precio = parseFloat(formValues.precio);
        producto.cantidadRef = parseFloat(formValues.cantidadRef);
        producto.unidad = formValues.unidad;

        guardarConfiguracion();
        renderProductos();
        actualizarResumen();

        Toast.fire({
            icon: 'success',
            title: 'Producto actualizado'
        });
    }
}

async function agregarProductoPersonalizado() {
    const { value: formValues } = await Swal.fire({
        title: 'Agregar Producto Personalizado',
        html: `
            <div style="text-align: left; margin: 1rem 0;">
                <label style="display: block; margin-bottom: 0.5rem; color: #cbd5e1;">Nombre del producto:</label>
                <input id="swal-nombre" class="swal2-input" type="text" placeholder="Ej: Chocolate" style="margin-top: 0;" onfocus="this.select()">
                
                <label style="display: block; margin: 1rem 0 0.5rem; color: #cbd5e1;">Precio:</label>
                <input id="swal-precio" class="swal2-input" type="number" placeholder="Ej: 5000" style="margin-top: 0;" onfocus="this.select()">
                
                <label style="display: block; margin: 1rem 0 0.5rem; color: #cbd5e1;">Cantidad de referencia:</label>
                <input id="swal-cantRef" class="swal2-input" type="number" placeholder="Ej: 1000" style="margin-top: 0;" onfocus="this.select()">
                
                <label style="display: block; margin: 1rem 0 0.5rem; color: #cbd5e1;">Unidad (gr, ml, unidad):</label>
                <input id="swal-unidad" class="swal2-input" type="text" placeholder="Ej: gr" style="margin-top: 0;" onfocus="this.select()">
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Agregar',
        cancelButtonText: 'Cancelar',
        background: '#1a1f2e',
        color: '#f8fafc',
        preConfirm: () => {
            const nombre = document.getElementById('swal-nombre').value;
            const precio = document.getElementById('swal-precio').value;
            const cantidadRef = document.getElementById('swal-cantRef').value;
            const unidad = document.getElementById('swal-unidad').value;

            if (!nombre || !precio || !cantidadRef || !unidad) {
                Swal.showValidationMessage('Todos los campos son requeridos');
                return false;
            }

            return { nombre, precio, cantidadRef, unidad }
        }
    });

    if (formValues) {
        if (!validarNumeroPositivo(formValues.precio, 'Precio')) return;
        if (!validarNumeroPositivo(formValues.cantidadRef, 'Cantidad de referencia')) return;

        const key = `custom_${Date.now()}`;
        productosPersonalizados[key] = {
            nombre: formValues.nombre,
            precio: parseFloat(formValues.precio),
            cantidadRef: parseFloat(formValues.cantidadRef),
            unidad: formValues.unidad
        };

        guardarConfiguracion();
        renderProductos();

        Toast.fire({
            icon: 'success',
            title: `Producto "${formValues.nombre}" agregado`
        });
    }
}

async function eliminarProductoPersonalizado(key) {
    const producto = productosPersonalizados[key];

    const result = await Swal.fire({
        title: '¿Eliminar producto?',
        text: `Se eliminará "${producto.nombre}"`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: '#1a1f2e',
        color: '#f8fafc'
    });

    if (result.isConfirmed) {
        delete productosPersonalizados[key];
        guardarConfiguracion();
        renderProductos();
        actualizarResumen();

        Toast.fire({
            icon: 'success',
            title: 'Producto eliminado'
        });
    }
}

// ========================================
// CÁLCULO DE COSTOS DE PRODUCTOS
// ========================================

function calcularCostoProducto(key) {
    const qtyInput = document.getElementById(`qty-${key}`);
    const cantidad = parseFloat(qtyInput.value);

    if (isNaN(cantidad) || cantidad <= 0) return 0;

    const producto = config.productos[key] || productosPersonalizados[key];
    if (!producto) return 0;

    // Costo proporcional
    const costo = (cantidad / producto.cantidadRef) * producto.precio;
    return costo;
}

// ========================================
// GAS - GESTIÓN Y CÁLCULOS
// ========================================

function actualizarPrecioGas() {
    document.getElementById('gasPrecio').value = Math.round(config.gas.precio).toLocaleString('es-CL');
    document.getElementById('gasKg').value = config.gas.kg;
}

async function editarPrecioGas() {
    const { value: formValues } = await Swal.fire({
        title: 'Configurar Gas',
        html: `
            <div style="text-align: left; margin: 1rem 0;">
                <label style="display: block; margin-bottom: 0.5rem; color: #cbd5e1;">Precio del balón:</label>
                <input id="swal-precio" class="swal2-input" type="number" value="${config.gas.precio}" style="margin-top: 0;" onfocus="this.select()">
                
                <label style="display: block; margin: 1rem 0 0.5rem; color: #cbd5e1;">Tamaño del balón (kg):</label>
                <input id="swal-kg" class="swal2-input" type="number" value="${config.gas.kg}" style="margin-top: 0;" onfocus="this.select()">
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        background: '#1a1f2e',
        color: '#f8fafc',
        preConfirm: () => {
            return {
                precio: document.getElementById('swal-precio').value,
                kg: document.getElementById('swal-kg').value
            }
        }
    });

    if (formValues) {
        if (!validarNumeroPositivo(formValues.precio, 'Precio')) return;
        if (!validarNumeroPositivo(formValues.kg, 'Kilogramos')) return;

        config.gas.precio = parseFloat(formValues.precio);
        config.gas.kg = parseFloat(formValues.kg);

        guardarConfiguracion();
        actualizarPrecioGas();
        actualizarGasDisplay();

        Toast.fire({
            icon: 'success',
            title: 'Configuración de gas actualizada'
        });
    }
}

function agregarUsoGas() {
    const horas = parseFloat(document.getElementById('gasHoras').value) || 0;
    const minutos = parseFloat(document.getElementById('gasMinutos').value) || 0;
    const temperatura = parseFloat(document.getElementById('gasTemperatura').value) || 0;

    if (!validarTemperatura(temperatura)) return;

    if (horas === 0 && minutos === 0) {
        Toast.fire({
            icon: 'warning',
            title: 'Debe ingresar al menos horas o minutos'
        });
        return;
    }

    // Cálculo del consumo de gas con fórmula especial
    const tiempoHoras = horas + (minutos / 60);
    const factorTemp = temperatura / 180; // Factor de temperatura basado en 180°C
    const consumoKg = config.gas.factor * factorTemp * tiempoHoras;
    const precioBalon = config.gas.precio;
    const kgBalon = config.gas.kg;
    const costoGas = (consumoKg / kgBalon) * precioBalon;

    const uso = {
        id: Date.now(),
        horas,
        minutos,
        temperatura,
        consumoKg,
        costo: costoGas
    };

    usosGas.push(uso);
    renderGasUsos();
    actualizarGasTotal();
    actualizarResumen();

    // Limpiar inputs
    document.getElementById('gasHoras').value = '';
    document.getElementById('gasMinutos').value = '';
    document.getElementById('gasTemperatura').value = '';

    Toast.fire({
        icon: 'success',
        title: 'Uso de gas agregado'
    });
}

function renderGasUsos() {
    const gasUsosList = document.getElementById('gasUsosList');
    if (usosGas.length === 0) {
        gasUsosList.innerHTML = '';
        return;
    }

    gasUsosList.innerHTML = usosGas.map(uso => `
        <div class="gas-uso-item">
            <span class="gas-uso-info">
                ${uso.horas}h ${uso.minutos}min a ${uso.temperatura}°C
                (${uso.consumoKg.toFixed(2)} kg)
            </span>
            <span class="gas-uso-cost">${formatearCLP(uso.costo)}</span>
            <button class="btn-delete" onclick="eliminarUsoGas(${uso.id})">🗑️</button>
        </div>
    `).join('');
}

function eliminarUsoGas(id) {
    usosGas = usosGas.filter(uso => uso.id !== id);
    renderGasUsos();
    actualizarGasTotal();
    actualizarResumen();
}

function actualizarGasTotal() {
    const total = usosGas.reduce((sum, uso) => sum + uso.costo, 0);
    const gasTotalDisplay = document.getElementById('gasTotalDisplay');

    if (total > 0) {
        gasTotalDisplay.innerHTML = `
            <strong>Total Gas:</strong> ${formatearCLP(total)}
        `;
        gasTotalDisplay.style.display = 'block';
    } else {
        gasTotalDisplay.style.display = 'none';
    }
}

function actualizarGasDisplay() {
    renderGasUsos();
    actualizarGasTotal();
}

// ========================================
// RESUMEN DE COSTOS
// ========================================

function actualizarResumen() {
    const costSummary = document.getElementById('costSummary');
    const totalCosto = document.getElementById('totalCosto');
    const profitMargin = parseFloat(document.getElementById('profitMargin').value) || 2.5;

    let items = [];
    let totalGeneral = 0;

    // Productos
    Object.keys(config.productos).forEach(key => {
        const checkbox = document.getElementById(`check-${key}`);
        if (checkbox && checkbox.checked) {
            const producto = config.productos[key];
            const qtyInput = document.getElementById(`qty-${key}`);
            const cantidad = parseFloat(qtyInput.value) || 0;

            if (cantidad > 0) {
                const costo = calcularCostoProducto(key);
                items.push({
                    nombre: producto.nombre,
                    cantidad: `${cantidad} ${producto.unidad}`,
                    costo
                });
                totalGeneral += costo;
            }
        }
    });

    // Productos personalizados
    Object.keys(productosPersonalizados).forEach(key => {
        const checkbox = document.getElementById(`check-${key}`);
        if (checkbox && checkbox.checked) {
            const producto = productosPersonalizados[key];
            const qtyInput = document.getElementById(`qty-${key}`);
            const cantidad = parseFloat(qtyInput.value) || 0;

            if (cantidad > 0) {
                const costo = calcularCostoProducto(key);
                items.push({
                    nombre: producto.nombre,
                    cantidad: `${cantidad} ${producto.unidad}`,
                    costo
                });
                totalGeneral += costo;
            }
        }
    });

    // Gas
    const totalGas = usosGas.reduce((sum, uso) => sum + uso.costo, 0);
    if (totalGas > 0) {
        items.push({
            nombre: 'Gas (Horno)',
            cantidad: `${usosGas.length} uso(s)`,
            costo: totalGas
        });
        totalGeneral += totalGas;
    }

    // Renderizar tabla
    if (items.length === 0) {
        costSummary.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Selecciona productos para ver el resumen</p>';
        totalCosto.innerHTML = '';
        document.getElementById('profitDisplay').innerHTML = '';
        document.getElementById('costChart').innerHTML = '';
    } else {
        costSummary.innerHTML = items.map(item => `
            <div class="cost-item">
                <span class="cost-item-name">
                    ${item.nombre}
                    <span class="cost-item-quantity">${item.cantidad}</span>
                </span>
                <span class="cost-item-value">${formatearCLP(item.costo)}</span>
            </div>
        `).join('');

        totalCosto.innerHTML = `<strong>Total de Costos:</strong> ${formatearCLP(totalGeneral)}`;

        // Actualizar margen de ganancia
        const precioSugerido = totalGeneral * profitMargin;
        document.getElementById('profitDisplay').innerHTML = `
            <div class="profit-title">Precio de Venta Sugerido</div>
            <div class="profit-value">${formatearCLP(precioSugerido)}</div>
        `;

        // Actualizar gráfico
        renderChart(items, totalGeneral);
    }
}

// ========================================
// GRÁFICO DE DISTRIBUCIÓN
// ========================================

function renderChart(items, total) {
    const costChart = document.getElementById('costChart');

    costChart.innerHTML = `
        <h3 class="chart-title">📊 Distribución de Costos</h3>
        <div class="chart-bars">
            ${items.map(item => {
        const porcentaje = (item.costo / total) * 100;
        return `
                    <div class="chart-bar">
                        <div class="chart-label">${item.nombre}</div>
                        <div class="chart-bar-container">
                            <div class="chart-bar-fill" style="width: ${porcentaje}%">
                                ${porcentaje.toFixed(1)}%
                            </div>
                        </div>
                        <div class="chart-value">${formatearCLP(item.costo)}</div>
                    </div>
                `;
    }).join('')}
        </div>
    `;
}

// ========================================
// HISTORIAL DE RECETAS
// ========================================

function guardarReceta() {
    console.log('🔵 guardarReceta() ejecutada');
    const nombreReceta = document.getElementById('recipeName').value.trim();

    // Validar nombre obligatorio
    if (!nombreReceta) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        document.getElementById('recipeName').focus();
        Toast.fire({
            icon: 'warning',
            title: 'Debes escribir un nombre para la receta'
        });
        return;
    }

    // Calcular total
    let totalGeneral = 0;

    Object.keys(config.productos).forEach(key => {
        const checkbox = document.getElementById(`check-${key}`);
        if (checkbox && checkbox.checked) {
            totalGeneral += calcularCostoProducto(key);
        }
    });

    Object.keys(productosPersonalizados).forEach(key => {
        const checkbox = document.getElementById(`check-${key}`);
        if (checkbox && checkbox.checked) {
            totalGeneral += calcularCostoProducto(key);
        }
    });

    const totalGas = usosGas.reduce((sum, uso) => sum + uso.costo, 0);
    totalGeneral += totalGas;

    if (totalGeneral === 0) {
        Toast.fire({
            icon: 'warning',
            title: 'No hay datos para guardar'
        });
        return;
    }

    const receta = {
        id: Date.now(),
        nombre: nombreReceta || `Receta ${recetaHistorial.length + 1}`,
        fecha: new Date().toLocaleDateString('es-CL'),
        total: totalGeneral,
        productos: { ...productosSeleccionados },
        gas: [...usosGas]
    };

    recetaHistorial.unshift(receta);

    // Mantener solo últimas 10
    if (recetaHistorial.length > 10) {
        recetaHistorial = recetaHistorial.slice(0, 10);
    }

    console.log('📝 Guardando receta:', receta);
    console.log('📚 Historial completo:', recetaHistorial);
    guardarConfiguracion();
    renderHistorial();

    Toast.fire({
        icon: 'success',
        title: `Receta "${receta.nombre}" guardada`
    });
}

function renderHistorial() {
    const historyList = document.getElementById('recipeHistory');

    console.log('🔄 Renderizando historial:', recetaHistorial);

    if (!Array.isArray(recetaHistorial) || recetaHistorial.length === 0) {
        historyList.innerHTML = '<div class="history-empty">No hay recetas guardadas aún</div>';
        return;
    }

    historyList.innerHTML = recetaHistorial.map(receta => `
        <div class="history-item" onclick="cargarReceta(${receta.id})">
            <div class="history-info">
                <div class="history-name">${receta.nombre}</div>
                <div class="history-date">${receta.fecha}</div>
            </div>
            <span class="history-cost">${formatearCLP(receta.total)}</span>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <button class="btn-delete" onclick="event.stopPropagation(); exportarReceta(${receta.id})" title="Exportar Receta" style="background: #3b82f6;">📥</button>
                <button class="btn-delete" onclick="event.stopPropagation(); eliminarReceta(${receta.id})" title="Eliminar">🗑️</button>
            </div>
        </div>
    `).join('');
}

function exportarReceta(id) {
    const receta = recetaHistorial.find(r => r.id === id);
    if (!receta) return;

    try {
        const blob = new Blob([JSON.stringify(receta, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // CAMBIO AQUÍ: Formato receta-nombre.json
        // Usamos .replace(/ /g, '-') para asegurar que sea un nombre de archivo válido
        a.download = `receta-${receta.nombre.replace(/ /g, '-')}.json`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Toast.fire({
            icon: 'success',
            title: 'Receta exportada'
        });
    } catch (error) {
        console.error('Error al exportar receta:', error);
        Toast.fire({
            icon: 'error',
            title: 'Error al exportar la receta'
        });
    }
}

// ========================================
// FUNCIÓN DE IMPRESIÓN PERSONALIZADA
// ========================================
function imprimirReceta() {
    // 1. Obtener los datos actuales
    const nombreInput = document.getElementById('recipeName').value.trim();
    const nombre = nombreInput || `Receta - ${new Date().toLocaleDateString('es-CL')}`;

    // Obtener el HTML de las secciones que te interesan
    const summaryHTML = document.getElementById('costSummary').innerHTML;
    const totalHTML = document.getElementById('totalCosto').innerHTML;
    const profitHTML = document.getElementById('profitDisplay').innerHTML;

    // 2. Crear o limpiar el área de impresión
    let printArea = document.getElementById('printable-area');
    if (!printArea) {
        printArea = document.createElement('div');
        printArea.id = 'printable-area';
        document.body.appendChild(printArea);
    }

    // 3. Inyectar el contenido con el formato deseado
    printArea.innerHTML = `
        <div class="print-container">
            <div class="print-header">
                <h1>${nombre}</h1>
                <p class="print-date">${new Date().toLocaleString('es-CL')}</p>
            </div>
            
            <div class="print-section">
                <h3>Resumen de Costos</h3>
                <div class="print-content-table">
                    ${summaryHTML}
                </div>
                <div class="print-total">
                    ${totalHTML}
                </div>
            </div>

            <div class="print-footer">
                ${profitHTML}
            </div>
        </div>
    `;

    // 4. Ejecutar la impresión
    window.print();
}



function importarReceta(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const receta = JSON.parse(e.target.result);

            // Validar estructura básica de receta
            if (!receta.nombre || !receta.total || !receta.productos) {
                throw new Error('Formato de receta inválido');
            }

            // Asignar nuevo ID para evitar colisiones
            receta.id = Date.now();
            receta.fecha = new Date().toLocaleDateString('es-CL');

            recetaHistorial.unshift(receta);
            if (recetaHistorial.length > 10) recetaHistorial.pop();

            guardarConfiguracion();
            renderHistorial();

            Toast.fire({
                icon: 'success',
                title: `Receta "${receta.nombre}" importada`
            });
        } catch (error) {
            console.error('Error al importar receta:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error al importar',
                text: 'El archivo no es una receta válida',
                background: '#1a1f2e',
                color: '#f8fafc'
            });
        }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset input
}

function cargarReceta(id) {
    const receta = recetaHistorial.find(r => r.id === id);
    if (!receta) return;

    // Restaurar nombre
    document.getElementById('recipeName').value = receta.nombre;

    // Reconstruir productosSeleccionados desde el snapshot
    productosSeleccionados = {};

    // Si la receta tiene el formato antiguo (objeto directo)
    if (receta.productos && !Array.isArray(receta.productos)) {
        productosSeleccionados = receta.productos;
    }
    // Si tiene el formato nuevo (array de snapshots)
    else if (Array.isArray(receta.productos)) {
        receta.productos.forEach(prod => {
            // Buscar el ID del producto por nombre
            const idProducto = Object.keys(config.productos).find(
                key => config.productos[key].nombre === prod.nombre
            ) || Object.keys(productosPersonalizados).find(
                key => productosPersonalizados[key].nombre === prod.nombre
            );

            if (idProducto) {
                productosSeleccionados[idProducto] = prod.cantidad;
            }
        });
    }

    // Restaurar checkboxes y cantidades
    Object.keys(config.productos).forEach(key => {
        const checkbox = document.getElementById(`check-${key}`);
        if (productosSeleccionados[key]) {
            checkbox.checked = true;
            document.getElementById(`qty-${key}`).disabled = false;
            document.getElementById(`qty-${key}`).value = productosSeleccionados[key];
        } else {
            checkbox.checked = false;
            document.getElementById(`qty-${key}`).disabled = true;
            document.getElementById(`qty-${key}`).value = '';
        }
    });

    Object.keys(productosPersonalizados).forEach(key => {
        const checkbox = document.getElementById(`check-${key}`);
        if (checkbox) {
            if (productosSeleccionados[key]) {
                checkbox.checked = true;
                document.getElementById(`qty-${key}`).disabled = false;
                document.getElementById(`qty-${key}`).value = productosSeleccionados[key];
            } else {
                checkbox.checked = false;
                document.getElementById(`qty-${key}`).disabled = true;
                document.getElementById(`qty-${key}`).value = '';
            }
        }
    });

    // Restaurar gas
    usosGas = receta.gas || [];
    renderGasUsos();
    actualizarGasTotal();

    actualizarResumen();

    Toast.fire({
        icon: 'success',
        title: `Receta "${receta.nombre}" cargada`
    });
}

async function eliminarReceta(id) {
    const receta = recetaHistorial.find(r => r.id === id);

    const result = await Swal.fire({
        title: '¿Eliminar receta?',
        text: `Se eliminará "${receta.nombre}"`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: '#1a1f2e',
        color: '#f8fafc'
    });

    if (result.isConfirmed) {
        recetaHistorial = recetaHistorial.filter(r => r.id !== id);
        guardarConfiguracion();
        renderHistorial();

        Toast.fire({
            icon: 'success',
            title: 'Receta eliminada'
        });
    }
}

// ========================================
// CONFIGURACIÓN MODAL
// ========================================

function abrirConfiguracion() {
    const modal = document.getElementById('configModal');
    modal.classList.add('active');

    // Renderizar productos base
    renderConfigProductos();

    // Renderizar productos personalizados
    renderConfigProductosPersonalizados();

    // Cargar configuración de gas
    document.getElementById('configGasKg').value = config.gas.kg;
    document.getElementById('configGasFactor').value = config.gas.factor;
}

function cerrarConfiguracion() {
    const modal = document.getElementById('configModal');
    modal.classList.remove('active');
}

function renderConfigProductos() {
    const configProductsList = document.getElementById('configProductsList');
    configProductsList.innerHTML = '';

    Object.entries(config.productos).forEach(([key, producto]) => {
        const div = document.createElement('div');
        div.className = 'config-product-item';
        div.innerHTML = `
            <div class="config-product-name">${producto.nombre}</div>
            <div class="config-product-inputs">
                <div class="input-field">
                    <label>Precio</label>
                    <input type="number" id="config-precio-${key}" value="${producto.precio}" class="input-config" onfocus="this.select()">
                </div>
                <div class="input-field">
                    <label>Cantidad Ref.</label>
                    <input type="number" id="config-cant-${key}" value="${producto.cantidadRef}" class="input-config" onfocus="this.select()">
                </div>
                <div class="input-field">
                    <label>Unidad</label>
                    <input type="text" id="config-unidad-${key}" value="${producto.unidad}" class="input-config" onfocus="this.select()">
                </div>
            </div>
        `;
        configProductsList.appendChild(div);
    });
}

function renderConfigProductosPersonalizados() {
    const configCustomProductsList = document.getElementById('configCustomProductsList');
    configCustomProductsList.innerHTML = '';

    if (Object.keys(productosPersonalizados).length === 0) {
        configCustomProductsList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1rem;">No hay productos personalizados</p>';
        return;
    }

    Object.entries(productosPersonalizados).forEach(([key, producto]) => {
        const div = document.createElement('div');
        div.className = 'config-product-item';
        div.innerHTML = `
            <div class="config-product-name">
                ${producto.nombre}
                <button class="btn-delete" onclick="eliminarProductoPersonalizado('${key}'); renderConfigProductosPersonalizados();" style="margin-left: auto;">🗑️</button>
            </div>
            <div class="config-product-inputs">
                <div class="input-field">
                    <label>Precio</label>
                    <input type="number" id="config-precio-${key}" value="${producto.precio}" class="input-config" onfocus="this.select()">
                </div>
                <div class="input-field">
                    <label>Cantidad Ref.</label>
                    <input type="number" id="config-cant-${key}" value="${producto.cantidadRef}" class="input-config" onfocus="this.select()">
                </div>
                <div class="input-field">
                    <label>Unidad</label>
                    <input type="text" id="config-unidad-${key}" value="${producto.unidad}" class="input-config" onfocus="this.select()">
                </div>
            </div>
        `;
        configCustomProductsList.appendChild(div);
    });
}

function guardarConfiguracionModal() {
    // Guardar productos base
    Object.keys(config.productos).forEach(key => {
        const precio = parseFloat(document.getElementById(`config-precio-${key}`).value);
        const cant = parseFloat(document.getElementById(`config-cant-${key}`).value);
        const unidad = document.getElementById(`config-unidad-${key}`).value;

        if (!isNaN(precio) && !isNaN(cant) && unidad) {
            config.productos[key].precio = precio;
            config.productos[key].cantidadRef = cant;
            config.productos[key].unidad = unidad;
        }
    });

    // Guardar productos personalizados
    Object.keys(productosPersonalizados).forEach(key => {
        const precioInput = document.getElementById(`config-precio-${key}`);
        const cantInput = document.getElementById(`config-cant-${key}`);
        const unidadInput = document.getElementById(`config-unidad-${key}`);

        if (precioInput && cantInput && unidadInput) {
            const precio = parseFloat(precioInput.value);
            const cant = parseFloat(cantInput.value);
            const unidad = unidadInput.value;

            if (!isNaN(precio) && !isNaN(cant) && unidad) {
                productosPersonalizados[key].precio = precio;
                productosPersonalizados[key].cantidadRef = cant;
                productosPersonalizados[key].unidad = unidad;
            }
        }
    });

    // Guardar configuración de gas
    const newKg = parseFloat(document.getElementById('configGasKg').value);
    const newFactor = parseFloat(document.getElementById('configGasFactor').value);

    if (!isNaN(newKg)) config.gas.kg = newKg;
    if (!isNaN(newFactor)) config.gas.factor = newFactor;

    guardarConfiguracion();
    renderProductos();
    actualizarPrecioGas();
    actualizarGasDisplay();
    actualizarResumen();
    cerrarConfiguracion();

    Toast.fire({
        icon: 'success',
        title: 'Configuración guardada'
    });
}

// ========================================
// FUNCIONES PRINCIPALES
// ========================================

// ========================================
// NUEVA RECETA / LIMPIAR FORMULARIO
// ========================================
async function nuevaReceta() {
    // Preguntar antes de limpiar para evitar accidentes
    const result = await Swal.fire({
        title: '¿Limpiar formulario?',
        text: "Se borrarán los datos de la receta actual para comenzar una nueva.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, limpiar',
        cancelButtonText: 'Cancelar',
        background: '#1a1f2e',
        color: '#f8fafc'
    });

    // Si el usuario confirma, procedemos a limpiar
    if (result.isConfirmed) {
        // 1. Limpiar nombre de receta
        const nameInput = document.getElementById('recipeName');
        if (nameInput) nameInput.value = '';

        // 2. Limpiar inputs y checkboxes de productos base
        Object.keys(config.productos).forEach(key => {
            const check = document.getElementById(`check-${key}`);
            const qty = document.getElementById(`qty-${key}`);

            if (check) check.checked = false;
            if (qty) {
                qty.value = '';
                qty.disabled = true;
            }
        });

        // 3. Limpiar inputs y checkboxes de productos personalizados
        Object.keys(productosPersonalizados).forEach(key => {
            const check = document.getElementById(`check-${key}`);
            const qty = document.getElementById(`qty-${key}`);

            if (check) check.checked = false;
            if (qty) {
                qty.value = '';
                qty.disabled = true;
            }
        });

        // 4. Resetear variables internas
        productosSeleccionados = {};
        usosGas = []; // Vaciar array de gas

        // 5. Limpiar visualmente la lista de gas y totales
        renderGasUsos();
        actualizarGasTotal();
        actualizarResumen();

        // 6. Mensaje de éxito
        Toast.fire({
            icon: 'success',
            title: 'Formulario listo para nueva receta'
        });
    }
}


// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    cargarConfiguracion();
    renderProductos();
    actualizarPrecioGas();
    renderGasUsos();
    actualizarGasTotal();
    renderHistorial();
    actualizarResumen();

    // Listener para margen de ganancia
    document.getElementById('profitMargin').addEventListener('input', actualizarResumen);

    // ---------------------BOTONES---------------------------


    const btnSave = document.querySelector('.btn-save');
    if (btnSave) {
        btnSave.onclick = guardarReceta;
    }

    // Listener para botón LIMPIAR / NUEVA RECETA
    const btnNew = document.querySelector('.btn-new');
    if (btnNew) {
        btnNew.onclick = nuevaReceta;
    }

    // Listener para botón IMPRIMIR
    const btnPrint = document.querySelector('.btn-print');
    if (btnPrint) {
        btnPrint.onclick = imprimirReceta;
    }


    console.log('📊 Calculadora de Insumos inicializada correctamente');
});