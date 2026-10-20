/**
 * Migration: Gas costs tracking table
 * Records XLM gas fees and USD costs for contract interactions.
 */

export async function up(knex) {
  return knex.schema.createTable('gas_costs', (table) => {
    table.increments('id').primary();
    table.string('tx_hash').notNullable().index();
    table.string('contract_id').notNullable().index();
    table.string('method').notNullable();
    table.decimal('gas_cost', 20, 7).notNullable();
    table.decimal('xlm_price', 20, 8).nullable();
    table.decimal('usd_cost', 20, 8).notNullable();
    table.timestamp('recorded_at').notNullable().defaultTo(knex.fn.now()).index();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Index for common queries
    table.index(['contract_id', 'recorded_at']);
  });
}

export async function down(knex) {
  return knex.schema.dropTable('gas_costs');
}
