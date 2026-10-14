import { pool } from '../src/server/database/db'

// Trava de segurança: os testes apagam tudo, então só rodam em banco de teste.
beforeAll(() => {
  if (!process.env.DB_NAME?.endsWith('_test')) {
    throw new Error('Os testes só podem rodar em um banco que termina com _test')
  }
})

beforeEach(async () => {
  await pool.execute('DELETE FROM order_items')
  await pool.execute('DELETE FROM orders')
  await pool.execute('DELETE FROM foods')
  await pool.execute('DELETE FROM rooms')
})

afterAll(async () => {
  await pool.end()
})