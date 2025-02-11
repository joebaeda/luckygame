import { type NextRequest, NextResponse } from "next/server"
import { ethers } from "ethers"
import { luckyAbi, luckyAddress } from "@/lib/luckySlot"

export async function GET(req: NextRequest) {
  try {
    // Extract user address from URL params
    const address = req.nextUrl.pathname.split("/").pop()

    // Validate Ethereum address
    if (!ethers.isAddress(address)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 })
    }

    // Check if BASE_RPC_ENDPOINT is set
    const baseProvider = process.env.BASE_RPC_ENDPOINT
    if (!baseProvider) {
      console.error("BASE_RPC_ENDPOINT is not set")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Initialize provider
    let provider
    try {
      provider = new ethers.JsonRpcProvider(baseProvider)
    } catch (providerError) {
      console.error("Error initializing provider:", providerError)
      return NextResponse.json({ error: "Failed to initialize provider" }, { status: 500 })
    }

    // Connect to contract
    const contract = new ethers.Contract(luckyAddress, luckyAbi, provider)

    // Call getSpinResult(address) from the contract
    const spinResult = await contract.getSpinResult(address)

    // Format the response
    const formattedResult = {
      numbers: spinResult[0].map((num: ethers.BigNumberish) => Number(num)),
      isWinner: spinResult[1],
      prizeAmount: ethers.formatUnits(spinResult[2], 18),
      protocolFee: ethers.formatUnits(spinResult[3], 18),
    }

    // Return the structured response
    return NextResponse.json(formattedResult)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error in GET request:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

