const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: './database.sqlite' // Archivo SQLite
  },
  useNullAsDefault: true
});

// Crear tabla de productos si no existe
knex.schema.hasTable('productos').then(async (exists) => {
  if (!exists) {
    await knex.schema.createTable('productos', (table) => {
      table.increments('id').primary();
      table.string('nombre');
      table.float('precio');
      table.integer('cantidad');
      table.string('estado').defaultTo('disponible');
      table.string('cliente').nullable();  // 👈 Asegurar que esta columna existe
      table.string('telefono').nullable(); // 👈 Asegurar que esta columna existe
      table.string('direccion').nullable(); // 👈 Asegurar que esta columna existe
      table.string('periodo').nullable();
      table.boolean('pago').defaultTo(false);
    });
    console.log('Tabla "productos" creada.');
  } else {
    // 🔄 Si la tabla ya existe, verificar si falta alguna columna y agregarla
    const columnas = await knex('productos').columnInfo();

    if (!columnas.cliente) {
      await knex.schema.alterTable('productos', (table) => {
        table.string('cliente').nullable();
      });
      console.log('✅ Columna "cliente" agregada.');
    }
    if (!columnas.telefono) {
      await knex.schema.alterTable('productos', (table) => {
        table.string('telefono').nullable();
      });
      console.log('✅ Columna "telefono" agregada.');
    }
    if (!columnas.direccion) {
      await knex.schema.alterTable('productos', (table) => {
        table.string('direccion').nullable();
      });
      console.log('✅ Columna "direccion" agregada.');
    }
  }
});


// Crear tabla de clientes si no existe
knex.schema.hasTable('clientes').then(async (exists) => {
  if (!exists) {
    await knex.schema.createTable('clientes', (table) => {
      table.increments('id').primary();
      table.string('nombre').notNullable();
      table.string('direccion').notNullable();
      table.string('dni').unique().notNullable();
      table.string('telefono').notNullable();
      table.string('garante_nombre').notNullable(); // Nombre del garante
      table.string('garante_telefono').notNullable(); // Teléfono del garante
    });
    console.log('Tabla "clientes" creada.');
  }
});
knex.schema.hasTable('pagos').then(async (exists) => {
  if (!exists) {
    await knex.schema.createTable('pagos', (table) => {
      table.increments('id').primary();
      table.integer('producto_id').references('id').inTable('productos').onDelete('CASCADE');
      table.string('mes'); // Nombre del mes
      table.string('estado_pago').defaultTo('debe'); // 'pagado' o 'debe'
      table.timestamp('fecha_pago').nullable(); // 👈 Nueva columna
      table.float('monto_pagado').defaultTo(0); // 👈 Nueva columna
    });
    console.log('Tabla "pagos" creada.');
  } else {
    // Verificar si falta alguna columna y agregarla
    const columnas = await knex('pagos').columnInfo();

    if (!columnas.fecha_pago) {
      await knex.schema.alterTable('pagos', (table) => {
        table.timestamp('fecha_pago').nullable();
      });
      console.log('✅ Columna "fecha_pago" agregada.');
    }

    if (!columnas.monto_pagado) {
      await knex.schema.alterTable('pagos', (table) => {
        table.float('monto_pagado').defaultTo(0);
      });
      console.log('✅ Columna "monto_pagado" agregada.');
    }
  }
});

// Crear tabla de ingresos si no existe
knex.schema.hasTable('ingresos').then(async (exists) => {
  if (!exists) {
    await knex.schema.createTable('ingresos', (table) => {
      table.increments('id').primary();
      table.integer('producto_id').references('id').inTable('productos').onDelete('CASCADE');
      table.float('monto_pagado').notNullable();
      table.text('fecha_pago').notNullable();
    });
    console.log('Tabla "ingresos" creada.');
  }
});




module.exports = knex;