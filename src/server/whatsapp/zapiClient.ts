type ZapiConfig = {
    instanceId: string
    token: string
    clientToken: string
    groupId: string
}

function getConfig(): ZapiConfig | null {
    const { ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN, ZAPI_GROUP_ID } = process.env
    if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN || !ZAPI_CLIENT_TOKEN || !ZAPI_GROUP_ID) {
        return null
    }

    return {
        instanceId: ZAPI_INSTANCE_ID,
        token: ZAPI_TOKEN,
        clientToken: ZAPI_CLIENT_TOKEN,
        groupId: ZAPI_GROUP_ID,
    }
}

export function isZapiConfigured(): boolean {
    return getConfig() !== null
}

export async function sendGroupMessage(message: string): Promise<boolean> {
    const config = getConfig()
    if (!config) return false
    const url = `https://api.z-api.io/instances/${config.instanceId}/token/${config.token}/send-text`

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Client-Token': config.clientToken,
        },
        body: JSON.stringify({ phone: config.groupId, message }),
        signal: AbortSignal.timeout(5000),
    })

    const body = await res.text()
    if (!res.ok) {
        throw new Error(`Z-API respondeu com status ${res.status}: ${body}`)
    }

    return true
}