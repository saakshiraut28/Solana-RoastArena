import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'

const prisma = new PrismaClient()
const connection = new Connection(
    process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    'confirmed'
)

const MERCHANT_WALLET = new PublicKey(process.env.MERCHANT_WALLET_ADDRESS!)
const ROAST_PRICE_SOL = 0.001
const ROAST_PRICE_LAMPORTS = ROAST_PRICE_SOL * 1_000_000_000

export async function GET() {
    const posts = await prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(posts)
}

export async function POST(req: Request) {
    try {
        const { text } = await req.json()

        if (!text) {
            return NextResponse.json({ error: 'Text required' }, { status: 400 })
        }

        const xPayment = req.headers.get('X-Payment')

        // No payment provided - return 402 with payment quote
        if (!xPayment) {
            return NextResponse.json(
                {
                    error: 'Payment required',
                    payment: {
                        recipient: MERCHANT_WALLET.toString(),
                        amount: ROAST_PRICE_LAMPORTS,
                        amountSOL: ROAST_PRICE_SOL,
                        cluster: process.env.SOLANA_CLUSTER || 'devnet',
                        network: 'solana'
                    }
                },
                {
                    status: 402,
                    headers: {
                        'X-Accept-Payment': 'solana',
                    }
                }
            )
        }

        // Decode and verify payment
        const paymentProof = JSON.parse(
            Buffer.from(xPayment, 'base64').toString('utf-8')
        )

        if (paymentProof.x402Version !== 1) {
            return NextResponse.json(
                { error: 'Unsupported x402 version' },
                { status: 400 }
            )
        }

        if (paymentProof.scheme !== 'exact') {
            return NextResponse.json(
                { error: 'Only exact payment scheme supported' },
                { status: 400 }
            )
        }

        // Deserialize the transaction
        const txBuffer = Buffer.from(
            paymentProof.payload.serializedTransaction,
            'base64'
        )
        const transaction = Transaction.from(txBuffer)

        // Verify transaction details before submitting
        const isValid = await verifyTransaction(transaction)

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid payment transaction' },
                { status: 402 }
            )
        }

        // Submit the transaction to Solana
        console.log('Submitting transaction to Solana...')
        const signature = await connection.sendRawTransaction(
            transaction.serialize(),
            {
                skipPreflight: false,
                preflightCommitment: 'confirmed',
            }
        )

        // Wait for confirmation
        await connection.confirmTransaction(signature, 'confirmed')

        console.log('Payment confirmed:', signature)

        // Payment successful - create the post
        const post = await prisma.post.create({ data: { text } })

        const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=${process.env.SOLANA_CLUSTER || 'devnet'}`

        return NextResponse.json({
            post,
            paymentDetails: {
                signature,
                amount: ROAST_PRICE_LAMPORTS,
                amountSOL: ROAST_PRICE_SOL,
                recipient: MERCHANT_WALLET.toString(),
                explorerUrl
            }
        })

    } catch (err) {
        console.error('Error:', err)
        return NextResponse.json(
            { error: 'Payment processing failed', details: (err as Error).message },
            { status: 500 }
        )
    }
}

async function verifyTransaction(transaction: Transaction): Promise<boolean> {
    try {
        // Basic verification: check if transaction has instructions
        if (!transaction.instructions || transaction.instructions.length === 0) {
            console.error('Transaction has no instructions')
            return false
        }

        const transferInstruction = transaction.instructions.find(ix => {
            const isSystemProgram = ix.programId.equals(
                new PublicKey('11111111111111111111111111111111')
            )

            if (!isSystemProgram) return false
            return ix.keys.some(key => key.pubkey.equals(MERCHANT_WALLET))
        })

        if (!transferInstruction) {
            console.error('No valid transfer instruction found')
            return false
        }

        const data = transferInstruction.data
        if (data.length !== 12) {
            console.error('Invalid instruction data length')
            return false
        }

        // Read amount (little-endian u64 at bytes 4-12)
        const amount = data.readBigUInt64LE(4)

        if (Number(amount) < ROAST_PRICE_LAMPORTS) {
            console.error(`Insufficient payment amount: ${amount} < ${ROAST_PRICE_LAMPORTS}`)
            return false
        }

        return true
    } catch (error) {
        console.error('Transaction verification error:', error)
        return false
    }
}