import {pool} from '../db/db'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'
import { type CreateFoodDTO, type FoodDTO } from '../../shared/foodDTO' 
import { randomUUID } from 'node:crypto'

export function toFoodDTO(data: RowDataPacket): FoodDTO {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    active: Boolean(data.active),
  }
}

export async function createFood(food: CreateFoodDTO): Promise<FoodDTO> {
    const id = randomUUID()
    await pool.execute<ResultSetHeader>(
        'INSERT INTO foods (id, name, description, active) VALUES (?, ?, ?, ?)',
        [id, food.name, food.description, food.active]
    )
    return { id, ...food }
}

export async function getFoodById(id: string): Promise<FoodDTO | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM foods WHERE id = ?',
        [id]
    )
    const row = rows[0]
    return row ? toFoodDTO(row) : null
}

export async function getAllFoods(): Promise<FoodDTO[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM foods'
    )
    return rows.map(toFoodDTO)
}

export async function getActiveFoods(): Promise<FoodDTO[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM foods WHERE active = true'
    )
    return rows.map(toFoodDTO)
}
export async function getInactiveFoods(): Promise<FoodDTO[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM foods WHERE active = false'
    )
    return rows.map(toFoodDTO)
}

export async function updateFood(id: string, food: CreateFoodDTO): Promise<FoodDTO | null> {
    await pool.execute<ResultSetHeader>(
        'UPDATE foods SET name = ?, description = ?, active = ? WHERE id = ?',
        [food.name, food.description, food.active, id]
    )
    return getFoodById(id)
}

export async function setInactiveFoodById(id: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
        'UPDATE foods SET active = false WHERE id = ?',
        [id]
    )
    return result.affectedRows > 0
}
