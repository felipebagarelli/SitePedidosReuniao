import { CreateRoomDTO, RoomDTO, UpdateRoomActiveDTO } from "../../shared/roomsDTO";
import { randomUUID } from 'node:crypto'
import { pool } from '../database/db'
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { map } from "zod";


function toRoomDTO(data: RowDataPacket): RoomDTO{
    return {
        id: data.id,
        name: data.name,
        active: Boolean(data.active)
    }
}

export async function createRoom(data: CreateRoomDTO): Promise<RoomDTO> {
    const id = randomUUID()
    await pool.execute<ResultSetHeader>(
        'INSERT INTO rooms (id, name, active) VALUES (?, ?, ?)',
        [id, data.name, data.active]
    )
    return { id, ...data}
}

export async function getAllRooms(): Promise<RoomDTO[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, name, active FROM rooms ORDER BY name'
    )
    return rows.map(toRoomDTO)
}

export async function getAllRoomsByActive(active: boolean): Promise<RoomDTO[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, name, active FROM rooms WHERE active = ? ORDER BY name',
        [active]
    )
    return rows.map(toRoomDTO)
}

export async function getRoomById(id: string): Promise<RoomDTO | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, name, active FROM rooms WHERE id = ?',
        [id]
    )
    const row = rows[0]
    return row ? toRoomDTO(row) : null
}

export async function updateRoomActiveById(data: UpdateRoomActiveDTO): Promise<RoomDTO | null> {
    await pool.execute<ResultSetHeader>(
        'UPDATE rooms SET active = ? WHERE id = ?',
        [ data.active , data.id]
    )
    return getRoomById(data.id)
}