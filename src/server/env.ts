import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const candidates = [path.join(process.cwd(), '.env')]
if (typeof __dirname !== 'undefined') {
    candidates.push(path.join(__dirname, '.env'))
}

const envPath = candidates.find(file => existsSync(file))

if (envPath) {
    for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue

        const separator = trimmed.indexOf('=')
        if (separator === -1) continue

        const key = trimmed.slice(0, separator).trim()
        let value = trimmed.slice(separator + 1).trim()

        const quoted =
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        if (quoted) value = value.slice(1, -1)

        if (process.env[key] === undefined) {
            process.env[key] = value
        }
    }
}