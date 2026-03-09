import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/user?deviceId=xxx
export async function GET(req: NextRequest) {
    const deviceId = req.nextUrl.searchParams.get('deviceId')
    if (!deviceId) return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 })

    let user = await prisma.user.findUnique({ where: { deviceId } })
    if (!user) {
        user = await prisma.user.create({ data: { deviceId, name: 'Player' } })
    }
    return NextResponse.json(user)
}

// POST /api/user  { deviceId, name }
export async function POST(req: NextRequest) {
    const { deviceId, name } = await req.json()
    if (!deviceId) return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 })

    const user = await prisma.user.upsert({
        where: { deviceId },
        update: { name },
        create: { deviceId, name },
    })
    return NextResponse.json(user)
}
