"use client";

import { useCallback, useEffect, useState } from "react";
import { useViewer } from "./providers/FrameContextProvider";
import sdk from "@farcaster/frame-sdk";
import { useAccount, useReadContract } from "wagmi";
import { luckyAbi, luckyAddress } from "@/lib/luckySlot";
import { formatEther, parseEther } from "viem";
import LuckySpin from "./components/LuckySpin";
import { base } from "wagmi/chains";

export default function Page() {
  const [showAddFrameModal, setShowAddFrameModal] = useState(false)
  const [isZeroLuckyBalance, setIsZeroLuckyBalance] = useState(false);
  const { fid, displayName, pfpUrl, added } = useViewer();

  const { address } = useAccount();

  const saveLuckyFrame = useCallback(() => {
    sdk.actions.addFrame()
  }, [])

  const closeLuckyFrame = useCallback(() => {
    sdk.actions.close()
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
    if (balance as bigint < parseEther("500000")) {
      setIsZeroLuckyBalance(true);
    }
  }, [balance]);

  useEffect(() => {
    if (added === false) {
      setShowAddFrameModal(true);
    } else {
      setShowAddFrameModal(false);
    }
  }, [added]);

  return (
    <main>
      {showAddFrameModal &&
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
      }

      {isZeroLuckyBalance ? (
        <div className="fixed flex p-4 justify-center items-center inset-0 bg-gray-100">
          <div className="w-full max-w-[384px] bg-yellow-600 rounded-2xl justify-start items-start p-4 mx-auto flex flex-col space-y-5">
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
        ) : (
          <LuckySpin fid={fid} displayName={displayName as string} pfp={pfpUrl as string} />
        )
      }

    </main>
  );
}
