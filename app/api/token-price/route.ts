import { NextResponse } from "next/server"

const tokenAddress = "0x40816ccC76971042B429eE882809D85cad3cCfa5"

export async function GET() {
  try {
    const response = await fetch(
      `https://api.geckoterminal.com/api/v2/simple/networks/base/token_price/${tokenAddress}`,
      {
        headers: {
          Accept: "application/json;version=20230302",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Error fetching token price: ${response.statusText}`)
    }

    const data = await response.json()

    // Extract the price from the correct path in the JSON structure
    const price = data.data.attributes.token_prices[tokenAddress.toLowerCase()]

    if (!price) {
      throw new Error("Price not found in the response")
    }

    return NextResponse.json({ tokenPrice: price })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}

