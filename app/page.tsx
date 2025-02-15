"use client"

import { luckyAbi, luckyAddress } from "@/lib/luckySlot"
import { useCallback, useEffect, useState } from "react"
import { type BaseError, useAccount, useChainId, useConnect, useReadContract, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi"
import { base } from "wagmi/chains"
import Image from "next/image"
import sdk from "@farcaster/frame-sdk"
import { formatEther } from "viem"
import StirringBalls from "./components/StirringBalls"
import { wagmiConfig } from "@/lib/wagmiConfig"
import { Howl } from "howler"
import { useViewer } from "./providers/FrameContextProvider"

const symbolMap: Record<number, string> = {
  0: "🍌",
  1: "🍋",
  2: "🍒",
  3: "🍇",
  4: "🍉",
  5: "🍊",
  6: "🍓",
  7: "🍑",
  8: "🥒",
  9: "🍎",
}
const symbolArray = Object.values(symbolMap)

// Sound files (place these in the "public/sounds" directory)
const backgroundSound = new Howl({
  src: ["/sounds/backsound.mp3"],
  loop: true,
  volume: 0.5,
});

const spinSound = new Howl({
  src: ["/sounds/spin.mp3"],
  loop: true,
  volume: 0.7,
});

const winResultSound = new Howl({
  src: ["/sounds/win-result.mp3"],
  volume: 1,
});

const losesResultSound = new Howl({
  src: ["/sounds/loses-result.mp3"],
  volume: 1,
});

export default function Page() {
  const [reels, setReels] = useState<string[]>(Array(4).fill("❓"))
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [showSpinResult, setShowSpinResult] = useState(false)
  const [showSpinError, setShowSpinError] = useState(false)
  const [showBuyTickerResult, setShowBuyTicketResult] = useState(false)
  const [showBuyTicketError, setShowBuyTicketError] = useState(false)
  const [calculatedValue, setCalculatedValue] = useState<string | null>(null)
  const [canSpin, setCanSpin] = useState(false);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false)
  const [showOverlay, setShowOverlay] = useState(true)

  const [showAddFrameModal, setShowAddFrameModal] = useState(false)
  const [isZeroLuckyBalance, setIsZeroLuckyBalance] = useState(false)
  const { fid, displayName, pfpUrl, added } = useViewer()

  // wagmi hooks
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()

  const saveLuckyFrame = useCallback(() => {
    sdk.actions.addFrame()
    setShowAddFrameModal(false);
  }, [])

  const closeLuckyFrame = useCallback(() => {
    sdk.actions.close()
    setShowAddFrameModal(false);
  }, [])

  const buyLuckyToken = useCallback(() => {
    sdk.actions.openUrl("https://clank.fun/t/0x40816ccC76971042B429eE882809D85cad3cCfa5")
  }, [])

  const { data: minHold } = useReadContract({
    address: luckyAddress,
    abi: luckyAbi,
    chainId: base.id,
    functionName: "minHolding",
  });

  const { data: balance } = useReadContract({
    address: luckyAddress,
    abi: luckyAbi,
    chainId: base.id,
    functionName: "checkLuckyBalance",
    args: [address as `0x${string}`],
  });

  useEffect(() => {
    if (Number(balance as bigint) < Number(minHold as bigint)) {
      setIsZeroLuckyBalance(true);
    }
  }, [balance, minHold]);

  useEffect(() => {
    if (added === false) {
      setShowAddFrameModal(true);
    }
  }, [added]);

  // Overlay Button
  const handleOpenGame = () => {
    setShowOverlay(false);
  };

  // Handle background sound lifecycle
  useEffect(() => {
    if (!spinning && !showSpinResult) {
      backgroundSound.play(); // Play background sound when the app starts
    }

    return () => {
      backgroundSound.stop(); // Stop background sound when component unmounts
    };
  }, [spinning, showSpinResult]);

  // Handle spin sound lifecycle
  useEffect(() => {
    if (spinning) {
      backgroundSound.stop(); // Stop background sound
      spinSound.play(); // Start spinning sound
    } else {
      spinSound.stop(); // Stop spinning sound when spin ends
    }
  }, [spinning]);

  // Handle result sound lifecycle
  useEffect(() => {
    if (showSpinResult && result === "🎉 Jackpot! 🎉") {
      spinSound.stop(); // Stop spinning sound
      winResultSound.play(); // Play Win result sound
    }

    if (showSpinResult && result === "🍀 Try again! 🍀") {
      spinSound.stop(); // Stop spinning sound
      losesResultSound.play(); // Play Loses result sound
    }
  }, [result, showSpinResult]);

  const showProfile = useCallback(() => {
    sdk.actions.viewProfile({ fid })
  }, [fid])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openBaseScan = useCallback((proofHash: any) => {
    sdk.actions.openUrl(`https://basescan.org/tx/${proofHash}`)
  }, [])

  const {
    data: spinHash,
    error: spinError,
    isPending: isSpinPending,
    writeContract: writeSpin
  } = useWriteContract()
  const {
    data: buyTicketHash,
    error: buyTicketError,
    isPending: isBuyTicketPending,
    writeContract: writeBuyTicket,
  } = useWriteContract()

  const { isLoading: isSpinConfirming, isSuccess: isSpinConfirmed } = useWaitForTransactionReceipt({ hash: spinHash });
  const { isLoading: isBuyTicketConfirming, isSuccess: isBuyTicketConfirmed } = useWaitForTransactionReceipt({ hash: buyTicketHash });

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

  const { data: playerSpin, refetch } = useReadContract({
    address: luckyAddress,
    abi: luckyAbi,
    chainId: base.id,
    functionName: "getPlayerSpins",
    args: [address as `0x${string}`],
  })

  // Must be connected to Base chain
  useEffect(() => {
    if (chainId !== base.id) {
      setIsWrongNetwork(true)
    }
  }, [chainId])

  useEffect(() => {
    if (playerSpin) {
      // Calculate the current day as a Unix timestamp in days
      const currentDay = Math.floor(Date.now() / (1000 * 60 * 60 * 24));

      // Determine if the player can spin today
      const lastSpinDay = playerSpin[0]; // Assuming playerSpin[0] is the last spin day (BigInt)
      const extraSpinsAvailable = playerSpin[2]; // Assuming playerSpin[2] is the number of extra spins

      const currentPlayCount = parseInt(localStorage.getItem(`${currentDay}_play`) || "0", 10);

      const canSpinToday = BigInt(currentDay) >= lastSpinDay && currentPlayCount < 3; // New day since last spin
      console.log(`${BigInt(currentDay)} == ${lastSpinDay}`)
      const hasExtraSpins = extraSpinsAvailable > 0; // Extra spins available

      // Update the state to enable/disable the spin button
      setCanSpin(canSpinToday || hasExtraSpins);
    }
  }, [address, playerSpin]);


  // Function to start the spin
  const spin = async () => {
    if (chainId === base.id) {
      setSpinning(true)
      setResult(null)

      try {
        writeSpin({
          abi: luckyAbi,
          chainId: base.id,
          address: luckyAddress,
          functionName: "spin",
        })

      } catch (error) {
        console.error("Error spinning:", error)
        setSpinning(false); // Stop spinning if transaction fails
      }
    } else {
      switchChain({ chainId: base.id })
    }
  }

  // Slot Animation
  useEffect(() => {
    if (spinning) {
      const animateReels = () => {
        setReels((prevReels) =>
          prevReels.map(() => symbolArray[Math.floor(Math.random() * symbolArray.length)])
        );
      };

      const interval = setInterval(animateReels, 100);

      return () => clearInterval(interval);
    }
  }, [spinning]);

  // Call api to get spin new result
  const fetchSpinResult = async (address: string) => {
    try {
      const response = await fetch(`/api/spinBy/${address}`);
      if (!response.ok) throw new Error("Failed to fetch spin result");

      const data = await response.json();
      return data; // { numbers, isWinner, prizeAmount, protocolFee }
    } catch (error) {
      console.error("Error fetching spin result:", error);
      return null;
    }
  };

  // Get Result
  useEffect(() => {
    // Calculate the current day as a Unix timestamp in days
    const currentDay = Math.floor(Date.now() / (1000 * 60 * 60 * 24));

    const getNewSpinData = async () => {
      if (!isSpinConfirmed || !address) return;

      // Add a delay before fetching the spin result
      await new Promise((resolve) => setTimeout(resolve, 15000)) // 15 seconds delay

      const newSpinData = await fetchSpinResult(address);

      if (newSpinData) {

        setSpinning(false); // Stop spinning animation when new data arrives
        setReels(newSpinData.numbers.map((num: number) => symbolMap[num]));
        setResult(newSpinData.isWinner ? "🎉 Jackpot! 🎉" : "🍀 Try again! 🍀");
        setShowSpinResult(true);

        // Increment play count
        const currentPlayCount = parseInt(localStorage.getItem(`${currentDay}_play`) || "0", 10);
        localStorage.setItem(`${currentDay}_play`, String(currentPlayCount + 1));

      }

    };

    getNewSpinData();
  }, [address, isSpinConfirmed]);

  // Set back to default
  useEffect(() => {
    if (showSpinResult === false) {
      setReels(Array(4).fill("❓"))
      refetch()
    }
  }, [refetch, showSpinResult])


  // Function to buy extra spin
  const buyExtraSpin = async () => {
    if (chainId === base.id) {
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
    } else {
      switchChain({ chainId: base.id })
    }
  }

  useEffect(() => {
    if (isBuyTicketConfirmed) {
      setShowBuyTicketResult(true)
    }
  }, [isBuyTicketConfirmed])

  useEffect(() => {
    if (spinError) {
      setShowSpinError(true)
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
          disabled={!isConnected || chainId !== base.id || isBuyTicketConfirming || isBuyTicketPending}
          className="bg-[#5e4a9d] rounded-2xl text-white font-extrabold p-3 text-xl transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isBuyTicketPending ? "Confirming..." : isBuyTicketConfirming ? "Waiting..." : "Buy Ticket"}
        </button>
        <button onClick={showProfile} className="flex text-white flex-row justify-between items-center gap-2">
          <p className="text-2xl font-extrabold">{displayName}</p>
          <Image
            className="w-12 h-12 object-cover rounded-lg"
            src={pfpUrl || "/placeholder.svg"}
            alt={displayName as string}
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
          Daily Spin: <span>{String(playerSpin?.[1] || 0) || "0"}</span>
        </p>
        <p className="flex justify-between w-full">
          Extra Spin: <span>{String(playerSpin?.[2] || 0) || "0"}</span>
        </p>
        <p className="flex justify-between w-full">
          Prize Pool: <span>{String(calculatedValue || "0")}</span>
        </p>
      </div>

      {/* Spin Button */}
      <div className="fixed rounded-t-2xl flex justify-center items-center p-4 w-full bottom-0 bg-yellow-600">
        {isConnected ? (
          <button
            onClick={spin}
            disabled={!isConnected || chainId !== base.id || !canSpin || spinning || isSpinConfirming || isSpinPending}
            className="text-white text-center font-extrabold py-2 text-2xl transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSpinPending ? "Confirming..." : isSpinConfirming ? "Waiting..." : spinning ? "Spinning..." : "Let's Spin"}
          </button>
        ) : isWrongNetwork ? (
          <button
            className="text-white text-center font-extrabold py-2 text-2xl transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => switchChain({ chainId: base.id })}>
            Switch to Base
          </button>
        ) : (
          <button
            className="text-white text-center font-extrabold py-2 text-2xl transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => connect({ connector: wagmiConfig.connectors[0] })}>
            Sig In
          </button>
        )}
      </div>

      {/* Spin Result */}
      {showSpinResult && result && (
        <div
          onClick={() => setShowSpinResult(false)}
          className="fixed inset-0 bg-[#1a0e25] bg-opacity-95 flex items-center justify-center z-50 p-4"
        >
          <div className="w-full max-w-[384px] bg-[#341e49] rounded-2xl p-6 shadow-lg">

            <div className="w-full flex flex-row space-x-4 justify-center items-center">
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

            <p className="text-white text-center text-2xl my-6">{result}</p>
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
          className="fixed inset-0 flex items-center justify-center z-50 bg-[#1a0e25] bg-opacity-95 p-4"
        >
          <div className="w-full max-w-[384px] bg-[#341e49] rounded-lg p-6 shadow-lg">
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
          className="fixed inset-0 bg-[#1a0e25] bg-opacity-95 flex items-center justify-center z-50 p-4"
        >
          <div className="w-full max-w-[384px] bg-[#341e49] rounded-2xl p-6 shadow-lg">
            <p className="text-white text-center text-2xl mb-6">
              Hi {displayName}, You got {String(playerSpin?.[2] || 0)}X extra spin and 100% cashback in $LUCKY token has been sent to
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
          className="fixed inset-0 flex items-center justify-center z-50 bg-[#1a0e25] bg-opacity-95 p-4"
        >
          <div className="w-full max-w-[384px] bg-[#341e49] rounded-lg p-6 shadow-lg">
            <p className="text-center text-white">
              Error: {(buyTicketError as BaseError).shortMessage || buyTicketError.message}
            </p>
          </div>
        </div>
      )}

      {showOverlay && (
        <div className="fixed p-4 inset-0 bg-[#1a0e25] bg-opacity-95 flex items-center justify-center z-50">
          <div className="w-full flex flex-col justify-center items-center max-w-[384px] bg-[#341e49] rounded-2xl p-6 shadow-lg">
            <Image
              className="w-40 h-40 -mt-24 object-cover rounded-full"
              src={pfpUrl || "/placeholder.svg"}
              alt={displayName as string}
              width={100}
              height={100}
              priority
            />
            <p className="text-white my-6">
              Hi <span className="font-bold text-yellow-500">{displayName}</span> 👋, Are you ready to play the LUCKY Game? This game is free without placing a bet and if you get the Jackpot &quot;🍌🍌🍌🍌&quot;, then you are the winner and the prize will be automatically sent to your wallet.
            </p>
            <button
              className="w-full bg-pink-900 text-white px-4 py-2 rounded-xl hover:bg-pink-950"
              onClick={handleOpenGame}
            >
              I&apos;am Ready!
            </button>
          </div>
        </div>
      )}

      {showAddFrameModal && (
        <div className="fixed p-4 inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full max-w-[384px] bg-yellow-600 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Add Lucky Game</h2>
            <p className="text-white mb-6">
              Hi {displayName}, Save Lucky Game to your Frame Collections for quick and easy access directly from your Frame Collections.
            </p>
            <div className="w-full flex justify-center items-center space-x-2">
              <button
                className="w-full bg-gray-300 px-4 py-2 rounded-xl hover:bg-gray-400"
                onClick={closeLuckyFrame}
              >
                Remind Me
              </button>
              <button
                className="w-full bg-pink-900 text-white px-4 py-2 rounded-xl hover:bg-pink-950"
                onClick={saveLuckyFrame}
              >
                Save Lucky
              </button>
            </div>
          </div>
        </div>
      )}

      {isZeroLuckyBalance && (
        <div className="fixed flex p-4 justify-center items-center inset-0 bg-gray-100">
          <div className="w-full max-w-[384px] bg-yellow-600 rounded-2xl justify-start items-start p-4 mx-auto flex flex-col space-y-5">

            {/* GeckoTerminal Embed Chart */}
            <div className="w-full h-64 mb-4">
              <iframe
                height="100%"
                width="100%"
                id="geckoterminal-embed"
                title="GeckoTerminal Embed"
                src="https://www.geckoterminal.com/base/pools/0x13dA08DD0e214239cd9550F7563BFefDa0052642?embed=1&info=0&swaps=0&grayscale=0&light_chart=0"
                allow="clipboard-write"
                allowFullScreen
                className="rounded-lg"
              ></iframe>
            </div>

            <h2 className="font-extrabold text-2xl">Hi {displayName} 👋</h2>
            <p className="text-white text-lg mb-6">
              To play this game you need {formatEther(minHold as bigint) || "0"} $LUCKY to hold in your wallet. Free to play but only for $LUCKY Token holders.
            </p>
            <button
              onClick={buyLuckyToken}
              className="w-full max-w-[384px] bg-purple-900 rounded-2xl text-white font-extrabold p-3 text-xl transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Buy $LUCKY
            </button>
          </div>
        </div>
      )}

    </div>
  )
}