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
      table.string('estado').defaultTo('disponible'); // Nueva columna
      table.integer('cliente_id').references('id').inTable('clientes').nullable(); // Relación con cliente
      table.string('periodo'); // Periodo de préstamo
      table.boolean('pago').defaultTo(false); // Estado de pago
    });
    console.log('Tabla "productos" creada.');
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

module.exports = knex;