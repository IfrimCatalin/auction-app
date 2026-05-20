"use client";

import { useEffect, useState } from "react";
import {
  getAuctionCountdownState,
  type AuctionCountdownState,
} from "@/lib/auction-countdown";

export function useAuctionCountdown(auctionEndIso: string): AuctionCountdownState {
  const [state, setState] = useState(() => getAuctionCountdownState(auctionEndIso));

  useEffect(() => {
    const tick = () => setState(getAuctionCountdownState(auctionEndIso));
    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [auctionEndIso]);

  return state;
}
