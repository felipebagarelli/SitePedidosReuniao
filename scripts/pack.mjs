import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'

rmSync('deploy', { recursive: true, force: true })
mkdirSync('deploy')

cpSync('dist/server/server.cjs', 'deploy/server.cjs')
cpSync('dist/web', 'deploy/web', { recursive: true })

writeFileSync(
    'deploy/package.json',
    JSON.stringify({ name: 'pedidos-reuniao', version: '1.0.0', main: 'server.cjs', scripts: { start: 'node server.cjs' } }, null, 2)
)

console.log('Pacote pronto na pasta deploy/')