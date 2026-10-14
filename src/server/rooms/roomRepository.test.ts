import type { RowDataPacket } from "mysql2";
import { pool } from "../database/db";
import { createRoom, getAllRooms, getAllRoomsByActive, getRoomById, updateRoomActiveById } from "./roomsRepository";

const UNKNOWN_ID = "00000000-0000-0000-0000-000000000000";

async function selectRoomRow(id: string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, name, active FROM rooms WHERE id = ?',
        [id]
    );
    return rows[0];
}

describe('createRoom', () => {
    it('grava a linha no banco', async () => {
        const created = await createRoom({name: 'Sala 1', active: true})
        const row = await selectRoomRow(created.id)

        expect(row).toMatchObject({name: 'Sala 1', active: 1})
    })

    it('devolve o DTO com active como boolean', async () => {
        const created = await createRoom({name: 'Sala 1', active: true})
        expect(created).toEqual({id: created.id, name: 'Sala 1', active: true})
    })

    it('gera ids diferentes para salas diferentes', async () =>{
        const a = await createRoom({name: 'Sala A', active: true})
        const b = await createRoom({name: 'Sala B', active: true})

        expect(a.id).not.toBe(b.id)
    })
})

describe('getAllRooms', () => {
    it('devolve lista vazia quando não há salas', async () => {
        expect(await getAllRooms()).toEqual([])
    })

    it('devolve todas, inclusive as inativas', async () => {
        await createRoom({ name: 'Ativa', active: true })
        await createRoom({ name: 'Inativa', active: false })

        const rooms = await getAllRooms()
        expect(rooms).toHaveLength(2)
    })
})

describe('getAllRoomsByActive', () => {
    it('devolve só as salas ativas', async () => {
        await createRoom({ name: 'Ativa', active: true })
        await createRoom({ name: 'Inativa', active: false })
        const rooms = await getAllRoomsByActive(true)
        expect(rooms).toHaveLength(1)
        expect(rooms[0]?.name).toBe('Ativa')
    })
    
    it('devolve só as salas inativas', async () => {
        await createRoom({ name: 'Ativa', active: true })
        await createRoom({ name: 'Inativa', active: false })
        const rooms = await getAllRoomsByActive(false)
        expect(rooms).toHaveLength(1)
        expect(rooms[0]?.name).toBe('Inativa')
    })
})

describe('getRoomById', () => {
    it('devolve a sala pelo id', async () => {
        const created = await createRoom({ name: 'Sala 1', active: true })
        const found = await getRoomById(created.id)
        expect(found).toEqual(created)
    })
    it('devolve null quando não encontra a sala', async () => {
        const found = await getRoomById(UNKNOWN_ID)
        expect(found).toBeNull()
    })
})

describe('updateRoomActiveById', () => {
    it('atualiza o campo active da sala', async () => {
        const created = await createRoom({ name: 'Sala 1', active: true })
        const updated = await updateRoomActiveById(created.id, false)
        expect(updated).toEqual({ ...created, active: false })
    })
})