"use client";

import { usePathname } from "next/navigation";
import MainHeader from "./MainHeader";
import DineHeader from "./DineHeader";
import OnlineHeader from "./OnlineHeader";
import EventHeader from "./EventHeader";
import LoungeHeader from "./LoungeHeader";

export default function HeaderManager() {
  const pathname = usePathname();

  if (pathname.startsWith("/dine")) {
    return <DineHeader />;
  }
  if (pathname.startsWith("/online")) {
    return <OnlineHeader />;
  }
  if (pathname.startsWith("/events")) {
    return <EventHeader />;
  }
  if (pathname.startsWith("/lounge-booking")) {
    return <LoungeHeader />;
  }
  return <MainHeader />;
}