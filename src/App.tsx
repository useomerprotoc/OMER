import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import { Nav } from "./components/Nav";
import { PreLaunchBar } from "./components/PreLaunch";
import { Footer } from "./components/Footer";
import { StatusBar } from "./components/StatusBar";
import { NoiseOverlay } from "./components/ui";

import { HowItWorks } from "./pages/HowItWorks";
import { Trade } from "./pages/Trade";
import { Holdings } from "./pages/Holdings";
import { Reserve } from "./pages/Reserve";
import { Market } from "./pages/Market";
import { Machine } from "./pages/Machine";
import { Docs } from "./pages/Docs";
import { NotFound } from "./pages/NotFound";

function ScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <NoiseOverlay />

      <div className="relative z-10 pb-12">
        <ScrollReset />
        <Nav />
        <PreLaunchBar />
        <main>
          <Routes>
            <Route path="/" element={<Trade />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/holdings" element={<Holdings />} />
            <Route path="/reserve" element={<Reserve />} />
            <Route path="/market" element={<Market />} />
            <Route path="/machine" element={<Machine />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>

      <StatusBar />
    </div>
  );
}
