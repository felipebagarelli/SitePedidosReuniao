import type { RowDataPacket } from "mysql2";
import { pool } from "../database/db";
import { createFood, getAllFoods, getActiveFoods, getFoodById, setInactiveFood, updateFood } from "./foodRepository";

const UNKNOWN_ID = "00000000-0000-0000-0000-000000000000";

async function selectFoodRow(id: string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, name, description, active FROM foods WHERE id = ?',
        [id]
    );
    return rows[0];
}


describe('createFood', () => {
    it('grava a linha no banco', async () => {
        const created = await createFood({name: 'Café', description: 'Xícara', active: true})
        const row =  await selectFoodRow(created.id)

        expect(row).toMatchObject({name: 'Café', description: 'Xícara', active: 1})
    })

    it('devolve o DTO com active como boolean', async () => {
        const created = await createFood({name: 'Café', description: 'Xícara', active: true})
        expect(created).toEqual({id: created.id, name: 'Café', description: 'Xícara', active: true})
    })

    it('gera ids diferentes para alimentos diferentes', async () =>{
        const a = await createFood({name: 'a', description: null, active: true})
        const b = await createFood({name: 'B', description: null, active: true})

        expect(a.id).not.toBe(b.id)
    })
})

describe('getAllFoods', () => {
  it('devolve lista vazia quando não há alimentos', async () => {
    expect(await getAllFoods()).toEqual([])
  })

  it('devolve todos, inclusive os inativos', async () => {
    await createFood({ name: 'Ativo', description: null, active: true })
    await createFood({ name: 'Inativo', description: null, active: false })

    const foods = await getAllFoods()

    expect(foods).toHaveLength(2)
  })
})

describe('getActiveFoods', () => {
  it('devolve só os alimentos ativos', async () => {
    await createFood({ name: 'Ativo', description: null, active: true })
    await createFood({ name: 'Inativo', description: null, active: false })

    const foods = await getActiveFoods()

    expect(foods).toHaveLength(1)
    expect(foods[0]?.name).toBe('Ativo')
  })
})

describe('getFoodById', () => {
  it('devolve o alimento pelo id', async () => {
    const created = await createFood({ name: 'Café', description: 'Xícara', active: true })

    const found = await getFoodById(created.id)

    expect(found).toEqual(created)
  })

  it('converte active 0 do banco para false', async () => {
    const created = await createFood({ name: 'Café', description: null, active: false })

    const found = await getFoodById(created.id)

    expect(found?.active).toBe(false)
  })

  it('devolve null quando o id não existe', async () => {
    expect(await getFoodById(UNKNOWN_ID)).toBeNull()
  })
})

describe('updateFood', () => {
  it('altera todos os campos e devolve o alimento atualizado', async () => {
    const created = await createFood({ name: 'Nome antigo', description: 'Descrição antiga', active: true })

    const updated = await updateFood(created.id, { name: 'Nome novo', description: 'Descrição nova', active: false })

    expect(updated).toEqual({ id: created.id, name: 'Nome novo', description: 'Descrição nova', active: false })
    expect(await selectFoodRow(created.id)).toMatchObject({ name: 'Nome novo', description: 'Descrição nova', active: 0 })
  })

  it('não altera os outros alimentos', async () => {
    const target = await createFood({ name: 'Alvo', description: 'D1', active: true })
    const other = await createFood({ name: 'Outro', description: 'D2', active: true })

    await updateFood(target.id, { name: 'Alvo novo', description: 'D3', active: false })

    expect(await selectFoodRow(other.id)).toMatchObject({ name: 'Outro', description: 'D2', active: 1 })
  })

  it('devolve null quando o id não existe', async () => {
    const updated = await updateFood(UNKNOWN_ID, { name: 'X', description: null, active: true })

    expect(updated).toBeNull()
  })
})

describe('setInactiveFood', () => {
  it('desativa o alimento e devolve true', async () => {
    const created = await createFood({ name: 'Café', description: null, active: true })

    const result = await setInactiveFood(created.id)

    expect(result).toBe(true)
    expect((await selectFoodRow(created.id))?.active).toBe(0)
  })

  it('não desativa os outros alimentos', async () => {
    const target = await createFood({ name: 'Alvo', description: null, active: true })
    const other = await createFood({ name: 'Outro', description: null, active: true })

    await setInactiveFood(target.id)

    expect((await selectFoodRow(other.id))?.active).toBe(1)
  })

  it('devolve false quando o id não existe', async () => {
    expect(await setInactiveFood(UNKNOWN_ID)).toBe(false)
  })
})

