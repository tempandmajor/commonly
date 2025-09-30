"use client";

import React from "react";
import App from "../src/App";
import { HelmetProvider } from "react-helmet-async";
import { TooltipProvider } from "../src/components/ui/tooltip";

export default function ClientApp() {
  return (
    <HelmetProvider>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </HelmetProvider>
  );
}
