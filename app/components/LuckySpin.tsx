"use client"

import { luckyAbi, luckyAddress } from "@/lib/luckySlot"
import { useCallback, useEffect, useState } from "react"
import { type BaseError, useAccount, useChainId, useReadContract, useWriteContract } from "wagmi"
import { base } from "wagmi/chains"
import Image from "next/image"
import sdk from "@farcaster/frame-sdk"
import { formatEther } from "viem"
import StirringBalls from "./StirringBalls"

const symbolMap: Record<number, string> = {
  0: "🍎",
  1: "🍋",
  2: "🍒",
  3: "🍇",
  4: "🍉",
  5: "🍊",
  6: "🍓",
  7: "🍑",
  8: "🥒",
  9: "🍆",
}
const symbolArray = Object.values(symbolMap)

interface ProfileProps {
  fid: number
  displayName: string
  pfp: string
}

export default function LuckySpin({ fid, displayName, pfp }: ProfileProps) {
  const [reels, setReels] = useState<string[]>(Array(4).fill(symbolArray[9]))
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [showSpinResult, setShowSpinResult] = useState(false)
  const [showSpinError, setShowSpinError] = useState(false)
  const [showBuyTickerResult, setShowBuyTicketResult] = useState(false)
  const [showBuyTicketError, setShowBuyTicketError] = useState(false)
  const [calculatedValue, setCalculatedValue] = useState<string | null>(null)
  const [freeSpinPerDay, setFreeSpinPerDay] = useState("")
  const [extraSpinPerDay, setExtraSpinPerDay] = useState("")

  const showProfile = useCallback(() => {
    sdk.actions.viewProfile({ fid })
  }, [fid])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openBaseScan = useCallback((proofHash: any) => {
    sdk.actions.openUrl(`https://basescan.org/tx/${proofHash}`)
  }, [])

  // wagmi hooks
  const chainId = useChainId()
  const { address, isConnected } = useAccount()
  const { data: spinHash, error: spinError, isSuccess: isSpinConfirmed, writeContract: writeSpin } = useWriteContract()
  const {
    data: buyTicketHash,
    error: buyTicketError,
    isPending: isBuyTicketConfirming,
    isSuccess: isBuyTicketConfirmed,
    writeContract: writeBuyTicket,
  } = useWriteContract()

  const { data: totalPrizePool } = useReadContract({
    address: luckyAddress,
    abi: luckyAbi,
    chainId: base.id,
    functionName: "prizesPool",
  })

  const { data: price } = useReadContract({
    address: luckyAddress,
    abi: luckyAbi,
    chainId: base.id,
    functionName: "ticketPrice",
  })

  const { data: freeSpin } = useReadContract({
    address: luckyAddress,
    abi: luckyAbi,
    chainId: base.id,
    functionName: "freeSpinPerDay",
  })

  const { data: playerSpin } = useReadContract({
    address: luckyAddress,
    abi: luckyAbi,
    chainId: base.id,
    functionName: "getPlayerSpins",
    args: [address as `0x${string}`],
  })

  const { data: spinData, refetch } = useReadContract({
    address: luckyAddress,
    abi: luckyAbi,
    chainId: base.id,
    functionName: "getSpinResult",
    args: [address as `0x${string}`],
  })

  // Start continuous slot animation
  const startAnimation = useCallback(() => {
    const animateReel = (reelIndex: number) => {
      setReels((prevReels) => {
        const newReels = [...prevReels]
        newReels[reelIndex] = symbolArray[Math.floor(Math.random() * symbolArray.length)]
        return newReels
      })
    }

    const intervals = reels.map((_, index) => setInterval(() => animateReel(index), 50 + index * 50))

    return () => intervals.forEach(clearInterval)
  }, [reels])

  // Stop animation and set final result
  const stopAnimation = useCallback((finalNumbers: number[], isWinner: boolean) => {
    setReels(finalNumbers.map((num) => symbolMap[num]))
    setResult(isWinner ? "🎉 Jackpot! 🎉" : "🍀 Try again! 🍀")
    setShowSpinResult(true)
  }, [])

  // Function to start the spin
  const spin = async () => {
    if (!isConnected || chainId !== base.id) return
    setSpinning(true)
    setResult(null)
    const stopAnimationFn = startAnimation()

    try {
      writeSpin({
        abi: luckyAbi,
        chainId: base.id,
        address: luckyAddress,
        functionName: "spin",
      })

      setTimeout(() => {
        refetch()
      }, 3000)
    } catch (error) {
      console.error("Error spinning:", error)
      stopAnimationFn()
    }
  }

  // Effect to process spin result
  useEffect(() => {
    if (isSpinConfirmed && spinData) {
      const [numbers, isWinner] = spinData
      stopAnimation(numbers.map(Number), isWinner)
      setSpinning(false)
    }
  }, [isSpinConfirmed, spinData, stopAnimation])

  // Function to buy extra spin
  const buyExtraSpin = async () => {
    if (!isConnected || chainId !== base.id) return

    try {
      writeBuyTicket({
        abi: luckyAbi,
        chainId: base.id,
        address: luckyAddress,
        functionName: "buyExtraSpins",
        value: price,
        args: [address as `0x${string}`],
      })
    } catch (error) {
      console.error("Error buying extra spin:", error)
    }
  }

  useEffect(() => {
    if (isBuyTicketConfirmed) {
      setShowBuyTicketResult(true)
    }
  }, [isBuyTicketConfirmed])

  useEffect(() => {
    if (spinError) {
      setShowBuyTicketError(true)
    }
  }, [spinError])

  useEffect(() => {
    if (buyTicketError) {
      setShowBuyTicketError(true)
    }
  }, [buyTicketError])

  useEffect(() => {
    async function fetchTokenPrice() {
      try {
        const response = await fetch("/api/token-price")
        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        const price = Number.parseFloat(data?.tokenPrice)

        if (isNaN(price)) {
          throw new Error("Invalid price received from API")
        }

        const value = Number(Number.parseFloat(formatEther(totalPrizePool || BigInt(0))).toFixed(0)) * price

        const formattedValue = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(value)

        setCalculatedValue(formattedValue)
      } catch (error) {
        console.error("Error in fetchTokenPrice:", error)
        setCalculatedValue(null)
      }
    }

    fetchTokenPrice()
  }, [totalPrizePool])

  useEffect(() => {
    if (freeSpin && playerSpin) {
      const freePlay = String(Number(freeSpin) - Number(playerSpin?.[1]))
      const playerPlay = String(playerSpin?.[2])
      setFreeSpinPerDay(freePlay)
      setExtraSpinPerDay(playerPlay)
    }

  }, [freeSpin, playerSpin])

  return (
    <div className="relative bg-[#17101f] p-4 flex flex-col items-center justify-center min-h-screen z-20">
      {/* Background Animation */}
      <div className="fixed inset-0 z-0">
        <StirringBalls />
      </div>

      {/* Navbar */}
      <div className="fixed w-full flex flex-row rounded-b-2xl justify-between items-center p-4 top-0 bg-yellow-500">
        <button
          onClick={buyExtraSpin}
          disabled={!isConnected || chainId !== base.id || isBuyTicketConfirming}
          className="bg-[#5e4a9d] rounded-2xl text-white font-extrabold p-3 text-xl transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isBuyTicketConfirming ? "Confirming..." : "Buy Ticket"}
        </button>
        <button onClick={showProfile} className="flex text-white flex-row justify-between items-center gap-2">
          <p className="text-2xl font-extrabold">{displayName}</p>
          <Image
            className="w-12 h-12 object-cover rounded-lg"
            src={pfp || "/placeholder.svg"}
            alt={displayName}
            width={50}
            height={50}
            priority
          />
        </button>
      </div>

      {/* Reels */}
      <div className="fixed p-4 top-52 w-full flex flex-row space-x-4 justify-center items-center">
        {reels.map((symbol, reelIndex) => {
          // Define different rotation values for each box
          const rotationValues = [12, -12, 6, -6]; // Customize these values
          const rotation = rotationValues[reelIndex % rotationValues.length]; // Ensure it loops if more than 4 boxes

          return (
            <div
              key={reelIndex}
              className="w-20 h-20 bg-yellow-400 rounded-lg overflow-hidden shadow-inner relative"
              style={{ transform: `rotate(${rotation}deg)` }} // Apply rotation dynamically
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl">{symbol}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Player Spin */}
      <div className="fixed p-4 bottom-28 w-full space-y-2 flex flex-col justify-start items-start text-white text-xl font-extrabold">
        <p className="flex justify-between w-full">
          Daily Spin: <span>{freeSpinPerDay || "0"}</span>
        </p>
        <p className="flex justify-between w-full">
          Extra Spin: <span>{extraSpinPerDay || "0"}</span>
        </p>
        <p className="flex justify-between w-full">
          Prize Pool: <span>{String(calculatedValue || "0")}</span>
        </p>
      </div>

      {/* Spin Button */}
      <div className="fixed rounded-t-2xl flex justify-center items-center p-4 w-full bottom-0 bg-yellow-600">
        <button
          onClick={spin}
          disabled={
            !isConnected ||
            chainId !== base.id ||
            spinning ||
            (Number(freeSpin) - Number(playerSpin?.[1]) === 0 && Number(playerSpin?.[2]) === 0)
          }
          className="text-white text-center font-extrabold py-2 text-2xl transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {spinning ? "Spinning..." : "Let's Spin"}
        </button>
      </div>

      {/* Spin Result */}
      {showSpinResult && (
        <div
          onClick={() => setShowSpinResult(false)}
          className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <div className="w-full max-w-[384px] bg-yellow-600 rounded-2xl p-6 shadow-lg">
            <p className="text-white text-center text-2xl mb-6">{result}</p>
            <button onClick={() => openBaseScan(spinHash)} className="w-full bg-pink-900 text-white px-4 py-2 rounded-xl hover:bg-pink-950 transition duration-300">
              Proof
            </button>
          </div>
        </div>
      )}

      {/* Spin Transaction Error */}
      {showSpinError && spinError && (
        <div
          onClick={() => setShowSpinError(false)}
          className="fixed inset-0 flex items-center justify-center z-50 bg-gray-100 bg-opacity-65 p-4"
        >
          <div className="w-full max-w-[384px] bg-yellow-600 rounded-lg p-6 shadow-lg">
            <p className="text-center text-white">
              Error: {(spinError as BaseError).shortMessage || spinError.message}
            </p>
          </div>
        </div>
      )}

      {/* Buy Ticket Result */}
      {showBuyTickerResult && (
        <div
          onClick={() => setShowBuyTicketResult(false)}
          className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <div className="w-full max-w-[384px] bg-yellow-600 rounded-2xl p-6 shadow-lg">
            <p className="text-white text-center text-2xl mb-6">
              Hi {displayName}, You got {playerSpin?.[2]}X extra spin and 100% cashback in $LUCKY token has been sent to
              your wallet.
            </p>
            <button onClick={() => openBaseScan(buyTicketHash)} className="w-full bg-pink-900 text-white px-4 py-2 rounded-xl hover:bg-pink-950 transition duration-300">
              Proof
            </button>
          </div>
        </div>
      )}

      {/* Buy Ticket Transaction Error */}
      {showBuyTicketError && buyTicketError && (
        <div
          onClick={() => setShowBuyTicketError(false)}
          className="fixed inset-0 flex items-center justify-center z-50 bg-gray-100 bg-opacity-65 p-4"
        >
          <div className="w-full max-w-[384px] bg-yellow-600 rounded-lg p-6 shadow-lg">
            <p className="text-center text-white">
              Error: {(buyTicketError as BaseError).shortMessage || buyTicketError.message}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

