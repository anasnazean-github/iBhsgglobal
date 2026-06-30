"use client";

import * as React from "react";
import { RotateCcw, ShieldAlert, Sparkles, Camera } from "lucide-react";
import { NavigationTabs } from "../navigation-tabs";
import { showToast } from "@/lib/toast";

interface SnapDealsModuleProps {
  profile?: {
    role: string;
    modules_access: string[];
  } | null;
}

// Math.ceil helper to guarantee rounding up to 2 decimal places
function roundUpToTwoDecimals(num: number): number {
  return Math.ceil((num || 0) * 100) / 100;
}

export function SnapDealsModule({ profile }: SnapDealsModuleProps) {
  const [activeTab, setActiveTab] = React.useState<string>("calculator");
  const [pricingMode, setPricingMode] = React.useState<"margin" | "rsp_cap">("margin");
  const [cost, setCost] = React.useState<string>("0");
  const [feeIf, setFeeIf] = React.useState<string>("4.50");
  const [feeDuty, setFeeDuty] = React.useState<string>("9.00");
  const [feeOther, setFeeOther] = React.useState<string>("12.00");
  const [marginHsg, setMarginHsg] = React.useState<string>("0.00");
  const [marginBuyer, setMarginBuyer] = React.useState<string>("0.00");
  const [customRsp, setCustomRsp] = React.useState<string>("");

  // Local state for margins to allow editing without immediate override on every keystroke
  const [localMarginHsg, setLocalMarginHsg] = React.useState<string>("0.00");
  const [localMarginBuyer, setLocalMarginBuyer] = React.useState<string>("0.00");

  const hsgInputRef = React.useRef<HTMLInputElement>(null);
  const buyerInputRef = React.useRef<HTMLInputElement>(null);
  const breakdownRef = React.useRef<HTMLDivElement>(null);
  const centerColRef = React.useRef<HTMLDivElement>(null);
  const rightColRef = React.useRef<HTMLDivElement>(null);
  const [copying, setCopying] = React.useState(false);

  const tabs = React.useMemo(() => [
    { id: "calculator", label: "Calculator" },
    { id: "active", label: "Active Deals" },
    { id: "archive", label: "Archive" }
  ], []);

  // Lock scroll behavior on mount to prevent any outer page movement/scrolling
  React.useEffect(() => {
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.style.overflow = "hidden";
      mainEl.style.height = "calc(100vh - 64px)";
    }
    return () => {
      if (mainEl) {
        mainEl.style.overflow = "";
        mainEl.style.height = "";
      }
    };
  }, []);

  // Parse values safely
  const parsedCost = parseFloat(cost) || 0;
  const parsedIf = parseFloat(feeIf) || 0;
  const parsedDuty = parseFloat(feeDuty) || 0;
  const parsedOther = parseFloat(feeOther) || 0;

  // Intermediate landcost calculations
  const ifCost = React.useMemo(() => roundUpToTwoDecimals(parsedCost * (parsedIf / 100)), [parsedCost, parsedIf]);
  const dutyCost = React.useMemo(() => roundUpToTwoDecimals(parsedCost * (parsedDuty / 100)), [parsedCost, parsedDuty]);
  const totalA = React.useMemo(() => roundUpToTwoDecimals(parsedCost + ifCost + dutyCost), [parsedCost, ifCost, dutyCost]);
  const otherCostVal = React.useMemo(() => roundUpToTwoDecimals(totalA * (parsedOther / 100)), [totalA, parsedOther]);
  const totalB = React.useMemo(() => roundUpToTwoDecimals(totalA + otherCostVal), [totalA, otherCostVal]);

  const parsedCustomRsp = parseFloat(customRsp) || 0;
  const totalMarginPercent = React.useMemo(() => {
    if (parsedCustomRsp <= 0) return 0;
    return ((parsedCustomRsp - totalB) / parsedCustomRsp) * 100;
  }, [parsedCustomRsp, totalB]);

  // Keep local inputs in sync with margin ground truth when they are not actively focused by user
  React.useEffect(() => {
    if (document.activeElement !== hsgInputRef.current) {
      setLocalMarginHsg(marginHsg);
    }
  }, [marginHsg]);

  React.useEffect(() => {
    if (document.activeElement !== buyerInputRef.current) {
      setLocalMarginBuyer(marginBuyer);
    }
  }, [marginBuyer]);

  // Balance margins helper (on cost change or initial target price load)
  const balanceOnCostChange = React.useCallback((newTotalB: number, currentRspVal: number, currentBuyerVal: number) => {
    if (currentRspVal <= 0) return;
    const marginPool = ((currentRspVal - newTotalB) / currentRspVal) * 100;
    const cappedBuyer = Math.min(Math.max(0, currentBuyerVal), Math.max(0, marginPool));
    const newHsg = Math.max(0, marginPool - cappedBuyer);
    
    const newBuyerStr = cappedBuyer.toFixed(2);
    const newHsgStr = newHsg.toFixed(2);
    
    setMarginBuyer(newBuyerStr);
    setMarginHsg(newHsgStr);
    setLocalMarginBuyer(newBuyerStr);
    setLocalMarginHsg(newHsgStr);
  }, []);

  // Event handlers
  const handleCostChange = (val: string) => {
    setCost(val);
    if (pricingMode === "rsp_cap") {
      const cVal = parseFloat(val) || 0;
      const ifC = roundUpToTwoDecimals(cVal * (parsedIf / 100));
      const dutyC = roundUpToTwoDecimals(cVal * (parsedDuty / 100));
      const tA = roundUpToTwoDecimals(cVal + ifC + dutyC);
      const oC = roundUpToTwoDecimals(tA * (parsedOther / 100));
      const tB = roundUpToTwoDecimals(tA + oC);
      balanceOnCostChange(tB, parsedCustomRsp, parseFloat(marginBuyer) || 0);
    }
  };

  const handleIfChange = (val: string) => {
    setFeeIf(val);
    if (pricingMode === "rsp_cap") {
      const ifPct = parseFloat(val) || 0;
      const ifC = roundUpToTwoDecimals(parsedCost * (ifPct / 100));
      const tA = roundUpToTwoDecimals(parsedCost + ifC + dutyCost);
      const oC = roundUpToTwoDecimals(tA * (parsedOther / 100));
      const tB = roundUpToTwoDecimals(tA + oC);
      balanceOnCostChange(tB, parsedCustomRsp, parseFloat(marginBuyer) || 0);
    }
  };

  const handleDutyChange = (val: string) => {
    setFeeDuty(val);
    if (pricingMode === "rsp_cap") {
      const dutyPct = parseFloat(val) || 0;
      const dutyC = roundUpToTwoDecimals(parsedCost * (dutyPct / 100));
      const tA = roundUpToTwoDecimals(parsedCost + ifCost + dutyC);
      const oC = roundUpToTwoDecimals(tA * (parsedOther / 100));
      const tB = roundUpToTwoDecimals(tA + oC);
      balanceOnCostChange(tB, parsedCustomRsp, parseFloat(marginBuyer) || 0);
    }
  };

  const handleOtherChange = (val: string) => {
    setFeeOther(val);
    if (pricingMode === "rsp_cap") {
      const otherPct = parseFloat(val) || 0;
      const oC = roundUpToTwoDecimals(totalA * (otherPct / 100));
      const tB = roundUpToTwoDecimals(totalA + oC);
      balanceOnCostChange(tB, parsedCustomRsp, parseFloat(marginBuyer) || 0);
    }
  };

  // Local changes for margins do not trigger immediate balancing/re-calculations
  const handleHsgMarginChange = (val: string) => {
    setLocalMarginHsg(val);
  };

  const handleBuyerMarginChange = (val: string) => {
    setLocalMarginBuyer(val);
  };

  // Perform balancing calculations onBlur (user is done typing)
  const handleHsgMarginBlur = () => {
    const val = parseFloat(localMarginHsg) || 0;
    if (pricingMode === "rsp_cap") {
      const cappedHsg = Math.min(Math.max(0, val), Math.max(0, totalMarginPercent));
      const buyerVal = Math.max(0, totalMarginPercent - cappedHsg);
      
      const newHsgStr = cappedHsg.toFixed(2);
      const newBuyerStr = buyerVal.toFixed(2);
      
      setMarginHsg(newHsgStr);
      setMarginBuyer(newBuyerStr);
      setLocalMarginHsg(newHsgStr);
      setLocalMarginBuyer(newBuyerStr);
    } else {
      const formatted = val.toFixed(2);
      setMarginHsg(formatted);
      setLocalMarginHsg(formatted);
    }
  };

  const handleBuyerMarginBlur = () => {
    const val = parseFloat(localMarginBuyer) || 0;
    if (pricingMode === "rsp_cap") {
      const cappedBuyer = Math.min(Math.max(0, val), Math.max(0, totalMarginPercent));
      const hsgVal = Math.max(0, totalMarginPercent - cappedBuyer);
      
      const newBuyerStr = cappedBuyer.toFixed(2);
      const newHsgStr = hsgVal.toFixed(2);
      
      setMarginBuyer(newBuyerStr);
      setMarginHsg(newHsgStr);
      setLocalMarginBuyer(newBuyerStr);
      setLocalMarginHsg(newHsgStr);
    } else {
      const formatted = val.toFixed(2);
      setMarginBuyer(formatted);
      setLocalMarginBuyer(formatted);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const handleRspChange = (val: string) => {
    setCustomRsp(val);
    if (pricingMode === "rsp_cap") {
      const activeRsp = parseFloat(val) || 0;
      if (activeRsp > 0) {
        const pool = ((activeRsp - totalB) / activeRsp) * 100;
        setMarginBuyer("0.00");
        setMarginHsg(Math.max(0, pool).toFixed(2));
      } else {
        setMarginBuyer("0.00");
        setMarginHsg("0.00");
      }
    }
  };

  // Switch between Pricing Modes
  const handleModeSwitch = (mode: "margin" | "rsp_cap") => {
    setPricingMode(mode);
    if (mode === "rsp_cap") {
      const activeRsp = parseFloat(customRsp) || 0;
      if (activeRsp > 0) {
        const pool = ((activeRsp - totalB) / activeRsp) * 100;
        setMarginBuyer("0.00");
        setMarginHsg(Math.max(0, pool).toFixed(2));
      } else {
        setMarginBuyer("0.00");
        setMarginHsg("0.00");
      }
    } else {
      // Prefill price tag input with calculated standard price tag
      if (calculations.priceTag > 0) {
        setCustomRsp(calculations.priceTag.toFixed(2));
      }
    }
  };

  const handleReset = () => {
    setCost("");
    setFeeIf("4.50");
    setFeeDuty("9.00");
    setFeeOther("12.00");
    setMarginHsg("0.00");
    setMarginBuyer("0.00");
    setLocalMarginHsg("0.00");
    setLocalMarginBuyer("0.00");
    setCustomRsp("");
  };

  // Perform core pricing calculations
  const calculations = React.useMemo(() => {
    const parsedHsg = parseFloat(marginHsg) || 0;
    const parsedBuyer = parseFloat(marginBuyer) || 0;
    const parsedCustomRsp = parseFloat(customRsp) || 0;

    let computedPriceTag = 0;
    let computedCostToBuyer = 0;
    let computedHsgProfit = 0;
    let computedBuyerProfit = 0;
    let isFormulaValid = true;

    if (pricingMode === "margin") {
      // Cost to buyer
      if (parsedHsg >= 100) {
        isFormulaValid = false;
      } else {
        computedCostToBuyer = roundUpToTwoDecimals(totalB / (1 - parsedHsg / 100));
      }

      // Price Tag (RSP)
      if (parsedBuyer >= 100) {
        isFormulaValid = false;
      } else {
        computedPriceTag = roundUpToTwoDecimals(computedCostToBuyer / (1 - parsedBuyer / 100));
      }

      computedHsgProfit = roundUpToTwoDecimals(computedCostToBuyer - totalB);
      computedBuyerProfit = roundUpToTwoDecimals(computedPriceTag - computedCostToBuyer);
    } else {
      // Price Tag is custom cap
      computedPriceTag = parsedCustomRsp;
      if (parsedCustomRsp <= 0) {
        isFormulaValid = false;
      } else {
        computedBuyerProfit = roundUpToTwoDecimals(parsedCustomRsp * (parsedBuyer / 100));
        computedHsgProfit = roundUpToTwoDecimals(parsedCustomRsp * (parsedHsg / 100));
        computedCostToBuyer = roundUpToTwoDecimals(parsedCustomRsp - computedBuyerProfit);

        if (roundUpToTwoDecimals(computedBuyerProfit + computedHsgProfit) > parsedCustomRsp) {
          isFormulaValid = false;
        }
      }
    }

    // GST calculations
    const inputGST = roundUpToTwoDecimals(dutyCost + (otherCostVal * 0.09));
    const outputGST = roundUpToTwoDecimals(computedCostToBuyer * 0.09);
    const netGST = roundUpToTwoDecimals(outputGST - inputGST);
    const netProfit = roundUpToTwoDecimals(computedHsgProfit - netGST);
    const loss = computedHsgProfit < 0;

    return {
      priceTag: computedPriceTag,
      costToBuyer: computedCostToBuyer,
      hsgProfit: computedHsgProfit,
      buyerProfit: computedBuyerProfit,
      inputGST,
      outputGST,
      netGST,
      netProfit,
      isFormulaValid,
      loss,
    };
  }, [pricingMode, totalB, marginHsg, marginBuyer, customRsp, dutyCost, otherCostVal]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  const handleCapture = async () => {
    if (!breakdownRef.current) return;
    setCopying(true);

    const centerCol = centerColRef.current;
    const rightCol = rightColRef.current;
    if (centerCol) centerCol.style.overflow = "hidden";
    if (rightCol) rightCol.style.overflow = "hidden";

    try {
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(breakdownRef.current, {
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      if (blob) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob
            })
          ]);
          showToast("Screenshot copied to clipboard!", "success");
        } catch (err) {
          console.warn("Clipboard copy failed, downloading instead:", err);
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "snap-deal-calculator.png";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast("Clipboard copy blocked. Downloaded image instead!", "info");
        }
      }
    } catch (err) {
      console.error("Capture failed:", err);
      showToast("Screenshot failed.", "error");
    } finally {
      if (centerCol) centerCol.style.overflow = "";
      if (rightCol) rightCol.style.overflow = "";
      setCopying(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 font-primary text-zinc-900 h-full overflow-hidden">
      
      {/* UNIVERSAL NAVIGATION TABS */}
      <NavigationTabs
        tabs={tabs}
        activeTabId={activeTab}
        onTabSelect={(tabId) => setActiveTab(tabId)}
      />

      {/* TAB CONTENT BODY */}
      <div className="w-full flex-grow flex-shrink min-h-0 overflow-hidden">
        {activeTab === "calculator" && (
          <div className="w-full h-full flex items-center justify-center p-2">
            <div className="relative flex items-center">
              {/* Card Container */}
              <div 
                className="w-full max-w-5xl h-[500px] bg-white border border-zinc-200 shadow-xl flex overflow-hidden"
              >
                
                {/* LEFT COLUMN: Inputs (32% width) */}
                <div className="w-[32%] p-5 flex flex-col justify-between overflow-y-auto border-r border-zinc-200">
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={14} className="text-zinc-600" />
                          <h2 className="text-sm font-bold tracking-tight text-zinc-950">Inputs</h2>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-medium">Pricing inputs & modes</p>
                      </div>
                      
                      <button
                        onClick={handleReset}
                        className="p-1 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 text-zinc-650 hover:text-zinc-900 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-400"
                        title="Reset inputs"
                      >
                        <RotateCcw size={12} className="hover:rotate-[-45deg] transition-transform duration-200" />
                      </button>
                    </div>

                    {/* Toggle Switch */}
                    <div className="w-full bg-zinc-100 border border-zinc-200 p-1 rounded-lg flex gap-1 shrink-0">
                      <button
                        onClick={() => handleModeSwitch("margin")}
                        className={`w-full py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-400 ${
                          pricingMode === "margin"
                            ? "bg-zinc-900 text-white shadow-sm"
                            : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50"
                        }`}
                      >
                        Margin
                      </button>
                      <button
                        onClick={() => handleModeSwitch("rsp_cap")}
                        className={`w-full py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-400 ${
                          pricingMode === "rsp_cap"
                            ? "bg-zinc-900 text-white shadow-sm"
                            : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50"
                        }`}
                      >
                        Price Tag Cap
                      </button>
                    </div>

                    {/* Input fields stack with rounded corner radius */}
                    <div className="flex flex-col gap-3">
                      {/* Cost Price */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-zinc-405 uppercase tracking-wider pl-0.5">
                          Cost Price
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-2.5 text-zinc-400 text-xs font-semibold select-none">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={cost}
                            onChange={(e) => handleCostChange(e.target.value)}
                            className="w-full pl-6 pr-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded text-xs font-bold text-zinc-800 outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all placeholder:text-zinc-300"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      {/* Freight / Duty / Other Cost in small grid */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[8.5px] font-bold text-zinc-400 uppercase tracking-wider pl-0.5 truncate">
                            Freight
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              step="0.01"
                              value={feeIf}
                              onChange={(e) => handleIfChange(e.target.value)}
                              className="w-full pl-1.5 pr-4 py-1 bg-zinc-50 border border-zinc-200 rounded text-[11px] font-bold text-zinc-800 outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
                            />
                            <span className="absolute right-1.5 text-zinc-400 text-[9px] font-bold select-none">%</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[8.5px] font-bold text-zinc-400 uppercase tracking-wider pl-0.5 truncate">
                            Duty
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              step="0.01"
                              value={feeDuty}
                              onChange={(e) => handleDutyChange(e.target.value)}
                              className="w-full pl-1.5 pr-4 py-1 bg-zinc-50 border border-zinc-200 rounded text-[11px] font-bold text-zinc-800 outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
                            />
                            <span className="absolute right-1.5 text-zinc-400 text-[9px] font-bold select-none">%</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[8.5px] font-bold text-zinc-400 uppercase tracking-wider pl-0.5 truncate" title="Storage, Admin, Log">
                            Other Cost
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              step="0.01"
                              value={feeOther}
                              onChange={(e) => handleOtherChange(e.target.value)}
                              className="w-full pl-1.5 pr-4 py-1 bg-zinc-50 border border-zinc-200 rounded text-[11px] font-bold text-zinc-800 outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
                            />
                            <span className="absolute right-1.5 text-zinc-400 text-[9px] font-bold select-none">%</span>
                          </div>
                        </div>
                      </div>

                      {/* Margins Inputs */}
                      <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 pt-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider pl-0.5">
                            Our Margin
                          </label>
                          <div className="relative flex items-center">
                            <input
                              ref={hsgInputRef}
                              type="number"
                              step="0.01"
                              value={localMarginHsg}
                              onChange={(e) => handleHsgMarginChange(e.target.value)}
                              onBlur={handleHsgMarginBlur}
                              onKeyDown={handleKeyDown}
                              className="w-full pl-2 pr-5 py-1 bg-zinc-50 border border-zinc-200 rounded text-xs font-bold text-zinc-800 outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
                            />
                            <span className="absolute right-2 text-zinc-400 text-[9px] font-bold select-none">%</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider pl-0.5">
                            Buyer Margin
                          </label>
                          <div className="relative flex items-center">
                            <input
                              ref={buyerInputRef}
                              type="number"
                              step="0.01"
                              value={localMarginBuyer}
                              onChange={(e) => handleBuyerMarginChange(e.target.value)}
                              onBlur={handleBuyerMarginBlur}
                              onKeyDown={handleKeyDown}
                              className="w-full pl-2 pr-5 py-1 bg-zinc-50 border border-zinc-200 rounded text-xs font-bold text-zinc-800 outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
                            />
                            <span className="absolute right-2 text-zinc-400 text-[9px] font-bold select-none">%</span>
                          </div>
                        </div>

                        {/* Custom Price Tag Cap: Hidden in Margin Mode */}
                        {pricingMode === "rsp_cap" && (
                          <div className="col-span-2 flex flex-col gap-1 animate-in fade-in duration-200">
                            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider pl-0.5">
                              Price Tag (Cap)
                            </label>
                            <div className="relative flex items-center">
                              <span className="absolute left-2.5 text-zinc-400 text-xs font-semibold select-none">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={customRsp}
                                onChange={(e) => handleRspChange(e.target.value)}
                                className="w-full pl-6 pr-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded text-xs font-bold text-zinc-800 outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Warning message if profit is negative */}
                  {calculations.loss && calculations.priceTag > 0 && (
                    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg p-2 text-red-750 mt-2 shrink-0 animate-in slide-in-from-bottom-1 duration-200">
                      <ShieldAlert size={12} className="shrink-0 text-red-600 animate-bounce" />
                      <span className="text-[9.5px] font-bold leading-normal">Warning: Margin is negative (loss).</span>
                    </div>
                  )}
                </div>

                {/* BREAKDOWN SECTION (CENTER + RIGHT COLUMNS): Targeted for screenshot */}
                <div 
                  ref={breakdownRef}
                  className="w-[68%] flex h-full overflow-hidden"
                >
                  {/* CENTER COLUMN: Cost & HSG Breakdown (50% of parent width) */}
                  <div 
                    ref={centerColRef}
                    className="w-1/2 bg-zinc-50/50 p-5 flex flex-col justify-between overflow-y-auto"
                  >
                    <div className="flex flex-col gap-3">
                      <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider border-b border-zinc-200 pb-2 shrink-0">
                        Cost & HSG Breakdown
                      </h3>
                      
                      {/* Cost Breakdown without (A) (B) */}
                      <div className="bg-white border border-zinc-200 rounded-lg p-2.5 text-[10px] font-semibold text-zinc-650 space-y-1 shadow-2xs">
                        <span className="block text-[8px] uppercase text-zinc-400 font-bold tracking-wider border-b border-zinc-100 pb-1">Cost Breakdown</span>
                        <div className="flex justify-between"><span>Base Cost</span><span className="font-medium text-zinc-700">{formatCurrency(parsedCost)}</span></div>
                        <div className="flex justify-between"><span>Freight ({feeIf}%)</span><span className="font-medium text-zinc-700">+{formatCurrency(ifCost)}</span></div>
                        <div className="flex justify-between"><span>Duty GST ({feeDuty}%)</span><span className="font-medium text-zinc-700">+{formatCurrency(dutyCost)}</span></div>
                        <div className="flex justify-between border-t border-zinc-100 pt-0.5 font-bold text-zinc-800"><span>Landcost</span><span>{formatCurrency(totalA)}</span></div>
                        <div className="flex justify-between"><span>Logistic ({feeOther}%)</span><span className="font-medium text-zinc-700">+{formatCurrency(otherCostVal)}</span></div>
                        <div className="flex justify-between border-t border-zinc-200 pt-0.5 font-black text-zinc-950 text-[11px] font-mono"><span>Total Cost</span><span>{formatCurrency(totalB)}</span></div>
                      </div>

                      {/* Our Margin Breakdown */}
                      <div className="bg-white border border-zinc-200 rounded-lg p-2.5 text-[10px] font-semibold text-zinc-650 space-y-1 shadow-2xs">
                        <span className="block text-[8px] uppercase text-zinc-400 font-bold tracking-wider border-b border-zinc-100 pb-1">Our Margin Breakdown</span>
                        <div className="flex justify-between"><span>Our Margin</span><span className="font-medium text-zinc-700">{(parseFloat(marginHsg) || 0).toFixed(2)}%</span></div>
                        <div className="flex justify-between"><span>Our Profit (Gross)</span><span className={calculations.loss ? "text-red-650 font-bold" : "text-emerald-650 font-bold"}>{formatCurrency(calculations.hsgProfit)}</span></div>
                      </div>
                    </div>

                    {/* Our Net Profit Container (matches height of Price Tag container) */}
                    <div className={`mt-auto w-full h-[96px] rounded-lg border text-center flex flex-col items-center justify-center gap-0.5 shadow-sm p-3 shrink-0 ${
                      calculations.loss ? "bg-red-50 border-red-200" : "bg-emerald-50/40 border-emerald-100"
                    }`}>
                      <span className="text-[8.5px] font-bold text-zinc-500 uppercase tracking-wider">Our Net Profit</span>
                      <span className={`text-2xl font-black font-mono leading-none ${calculations.loss ? "text-red-600" : "text-emerald-700"}`}>
                        {formatCurrency(calculations.netProfit)}
                      </span>
                      <div className="text-[8px] text-zinc-400 font-semibold italic mt-1.5">
                        Gross ({formatCurrency(calculations.hsgProfit)}) - Net GST ({formatCurrency(calculations.netGST)})
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Buyer & Price Tag Breakdown (50% of parent width, border-l) */}
                  <div 
                    ref={rightColRef}
                    className="w-1/2 bg-zinc-100/30 p-5 flex flex-col justify-between overflow-y-auto border-l border-zinc-200"
                  >
                    <div className="flex flex-col gap-3">
                      <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider border-b border-zinc-200 pb-2 shrink-0">
                        Buyer & Price Tag
                      </h3>

                      {/* Buyer Margin & Profit Breakdown */}
                      <div className="bg-white border border-zinc-200 rounded-lg p-2.5 text-[10px] font-semibold text-zinc-650 space-y-1 shadow-2xs">
                        <span className="block text-[8px] uppercase text-zinc-400 font-bold tracking-wider border-b border-zinc-100 pb-1">Buyer Margin & Profit</span>
                        <div className="flex justify-between"><span>Buyer Margin</span><span className="font-medium text-zinc-700">{(parseFloat(marginBuyer) || 0).toFixed(2)}%</span></div>
                        <div className="flex justify-between"><span>Buyer Profit</span><span className="font-medium text-zinc-700">{formatCurrency(calculations.buyerProfit)}</span></div>
                      </div>

                      {/* Price Tag Breakdown (With GST / Without GST) */}
                      <div className="bg-white border border-zinc-200 rounded-lg p-2.5 text-[10px] font-semibold text-zinc-650 space-y-1.5 shadow-2xs">
                        <span className="block text-[8px] uppercase text-zinc-400 font-bold tracking-wider border-b border-zinc-100 pb-1">Price Tag Breakdown</span>
                        <div className="flex justify-between"><span>Standard RSP (No GST)</span><span className="text-zinc-950 font-bold">{formatCurrency(calculations.priceTag)}</span></div>
                        <div className="flex justify-between border-t border-zinc-100 pt-1 text-emerald-600 font-bold">
                          <span className="flex items-center gap-0.5">RSP + 9% GST</span>
                          <span>{formatCurrency(calculations.priceTag * 1.09)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Big Display Pricing Result Card: Always shows Standard Price Tag (RSP) (matches height of Net Profit container) */}
                    <div className="mt-auto w-full h-[96px] bg-zinc-900 border border-zinc-950 text-white rounded-lg p-3 text-center flex flex-col items-center justify-center gap-0.5 shadow-md shrink-0">
                      <span className="text-[8.5px] font-bold text-zinc-400 uppercase tracking-wider">
                        Price Tag (Standard RSP)
                      </span>
                      <span className={`text-2xl font-black font-mono leading-none tracking-tight ${calculations.loss ? "text-red-400" : "text-emerald-400"}`}>
                        {formatCurrency(calculations.priceTag)}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-bold uppercase mt-1">
                        Standard RSP (No GST)
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* FLOATING CAMERA SCREENSHOT BUTTON */}
              <button
                onClick={handleCapture}
                disabled={copying}
                className="absolute top-1/2 -right-12 -translate-y-1/2 w-9 h-9 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full flex items-center justify-center shadow-lg border border-zinc-700 transition-all cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                title="Copy screenshot to clipboard"
              >
                <Camera size={15} className={copying ? "animate-pulse" : ""} />
              </button>
            </div>
          </div>
        )}

        {activeTab === "active" && (
          <div className="w-full h-full min-h-[400px]" />
        )}

        {activeTab === "archive" && (
          <div className="w-full h-full min-h-[400px]" />
        )}
      </div>

    </div>
  );
}
