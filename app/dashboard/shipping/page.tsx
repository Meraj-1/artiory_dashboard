"use client";
import React, { useState, useEffect } from "react";
import {
  Truck,
  Search,
  Calculator,
  MapPin,
  Building2,
  Store,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Phone,
  Package,
  ShieldCheck,
  Printer,
  RotateCcw,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Clock,
  ChevronRight,
  Info,
} from "lucide-react";

const cardStyle = { backgroundColor: "#09090b", border: "1px solid #27272a" };
const inputClass = "w-full border border-zinc-700 rounded-xl p-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-white focus:border-white bg-zinc-900 text-white placeholder-zinc-500 transition-all shadow-inner";
const labelClass = "block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5";

export default function ShippingLogisticsHub() {
  const [activeTab, setActiveTab] = useState<
    "tracker" | "rates" | "pincode" | "warehouses" | "stores" | "labels" | "ndr"
  >("tracker");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com";

  // --- 1. TRACKER STATE ---
  const [trackAwb, setTrackAwb] = useState("");
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackAwb.trim()) return;
    try {
      setTrackLoading(true);
      setTrackError(null);
      setTrackResult(null);

      const res = await fetch(`${API_BASE}/api/logistics/order/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awb_number_list: trackAwb.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to retrieve tracking details");
      }
      setTrackResult(json.data);
    } catch (err: any) {
      setTrackError(err.message || "Error fetching tracking data");
    } finally {
      setTrackLoading(false);
    }
  };

  // --- 2. RATE CALCULATOR STATE ---
  const [fromPin, setFromPin] = useState("400071");
  const [toPin, setToPin] = useState("110001");
  const [weightKg, setWeightKg] = useState("0.5");
  const [lengthCm, setLengthCm] = useState("15");
  const [widthCm, setWidthCm] = useState("12");
  const [heightCm, setHeightCm] = useState("5");
  const [payMethod, setPayMethod] = useState("Prepaid");
  const [mrpVal, setMrpVal] = useState("500");
  const [rateLoading, setRateLoading] = useState(false);
  const [rateResult, setRateResult] = useState<any>(null);
  const [zoneResult, setZoneResult] = useState<any>(null);
  const [rateError, setRateError] = useState<string | null>(null);

  const handleCalculateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRateLoading(true);
      setRateError(null);
      setRateResult(null);
      setZoneResult(null);

      // 1. Direct Rate Check
      const rateRes = await fetch(`${API_BASE}/api/logistics/rate/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_pincode: Number(fromPin),
          to_pincode: Number(toPin),
          shipping_length_cms: Number(lengthCm),
          shipping_width_cms: Number(widthCm),
          shipping_height_cms: Number(heightCm),
          shipping_weight_kg: Number(weightKg),
          payment_method: payMethod,
          product_mrp: Number(mrpVal),
        }),
      });
      const rateJson = await rateRes.json();
      if (rateRes.ok && rateJson.success) {
        setRateResult(rateJson);
      }

      // 2. Zone Rates Breakdown
      const zoneRes = await fetch(`${API_BASE}/api/logistics/rate/zone-rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_pincode: Number(fromPin),
          shipping_length_cms: Number(lengthCm),
          shipping_width_cms: Number(widthCm),
          shipping_height_cms: Number(heightCm),
          shipping_weight_kg: Number(weightKg),
          payment_method: payMethod,
          product_mrp: Number(mrpVal),
        }),
      });
      const zoneJson = await zoneRes.json();
      if (zoneRes.ok && zoneJson.success) {
        setZoneResult(zoneJson.data);
      }
    } catch (err: any) {
      setRateError(err.message || "Failed to calculate shipping rates");
    } finally {
      setRateLoading(false);
    }
  };

  // --- 3. PINCODE CHECK STATE ---
  const [checkPin, setCheckPin] = useState("400071");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinResult, setPinResult] = useState<any>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  const handleCheckPincode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPin.trim()) return;
    try {
      setPinLoading(true);
      setPinError(null);
      setPinResult(null);

      const res = await fetch(`${API_BASE}/api/logistics/pincode/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode: checkPin.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Pincode serviceability check failed");
      }
      setPinResult(json);
    } catch (err: any) {
      setPinError(err.message || "Failed to verify pincode");
    } finally {
      setPinLoading(false);
    }
  };

  // --- 4. WAREHOUSES STATE ---
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [whLoading, setWhLoading] = useState(false);
  const [whError, setWhError] = useState<string | null>(null);
  const [showAddWh, setShowAddWh] = useState(false);

  // States & Cities for Warehouse Form
  const [statesList, setStatesList] = useState<any[]>([]);
  const [citiesList, setCitiesList] = useState<any[]>([]);
  const [selectedStateId, setSelectedStateId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [whCompany, setWhCompany] = useState("Athena Design Studios (Artiory)");
  const [whAddr1, setWhAddr1] = useState("Plot No 7, Moti Baug");
  const [whAddr2, setWhAddr2] = useState("Chembur");
  const [whMobile, setWhMobile] = useState("7304185760");
  const [whPin, setWhPin] = useState("400071");
  const [whSubmitting, setWhSubmitting] = useState(false);
  const [whSuccessMsg, setWhSuccessMsg] = useState<string | null>(null);

  const fetchWarehouses = async () => {
    try {
      setWhLoading(true);
      setWhError(null);
      const res = await fetch(`${API_BASE}/api/logistics/warehouse/get`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setWarehouses(Array.isArray(json.data) ? json.data : Object.values(json.data || {}));
      } else {
        setWhError(json.message || "Could not fetch warehouses");
      }
    } catch (err: any) {
      setWhError(err.message || "Error loading warehouses");
    } finally {
      setWhLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/logistics/state/get`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country_id: 101 }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setStatesList(Array.isArray(json.data) ? json.data : Object.values(json.data || {}));
      }
    } catch (e) {
      console.error("Failed to load states:", e);
    }
  };

  const fetchCities = async (stateId: string) => {
    if (!stateId) return;
    try {
      const res = await fetch(`${API_BASE}/api/logistics/city/get`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state_id: Number(stateId) }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setCitiesList(Array.isArray(json.data) ? json.data : Object.values(json.data || {}));
      }
    } catch (e) {
      console.error("Failed to load cities:", e);
    }
  };

  const handleStateChange = (stateId: string) => {
    setSelectedStateId(stateId);
    setSelectedCityId("");
    setCitiesList([]);
    fetchCities(stateId);
  };

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setWhSubmitting(true);
      setWhSuccessMsg(null);
      setWhError(null);

      const res = await fetch(`${API_BASE}/api/logistics/warehouse/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: whCompany,
          address1: whAddr1,
          address2: whAddr2,
          mobile: Number(whMobile),
          pincode: Number(whPin),
          state_id: Number(selectedStateId) || undefined,
          city_id: Number(selectedCityId) || undefined,
          country_id: 101,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setWhSuccessMsg(json.message || "Warehouse added successfully!");
        setShowAddWh(false);
        fetchWarehouses();
      } else {
        throw new Error(json.message || "Failed to create warehouse");
      }
    } catch (err: any) {
      setWhError(err.message || "Error submitting warehouse");
    } finally {
      setWhSubmitting(false);
    }
  };

  // --- 5. STORES STATE ---
  const [stores, setStores] = useState<any[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storeOrders, setStoreOrders] = useState<any[]>([]);
  const [storeOrdersLoading, setStoreOrdersLoading] = useState(false);
  const [startDateFilter, setStartDateFilter] = useState("2026-08-01");
  const [endDateFilter, setEndDateFilter] = useState("2026-08-28");

  const fetchStores = async () => {
    try {
      setStoresLoading(true);
      const res = await fetch(`${API_BASE}/api/logistics/store/get`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setStores(Array.isArray(json.data) ? json.data : Object.values(json.data || {}));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStoresLoading(false);
    }
  };

  const fetchStoreOrderList = async () => {
    try {
      setStoreOrdersLoading(true);
      const res = await fetch(`${API_BASE}/api/logistics/store/get-order-list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform_id: 1,
          start_date: startDateFilter,
          end_date: endDateFilter,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setStoreOrders(Array.isArray(json.data) ? json.data : Object.values(json.data || {}));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStoreOrdersLoading(false);
    }
  };

  // --- 6. LABELS & INVOICE UTILITY STATE ---
  const [utilAwb, setUtilAwb] = useState("");
  const [labelPageSize, setLabelPageSize] = useState("A4");
  const [utilLoading, setUtilLoading] = useState(false);
  const [utilMsg, setUtilMsg] = useState<{ success: boolean; text: string } | null>(null);

  const handlePrintLabel = async () => {
    if (!utilAwb.trim()) return;
    try {
      setUtilLoading(true);
      setUtilMsg(null);
      const res = await fetch(`${API_BASE}/api/logistics/shipping/label`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          awb_numbers: utilAwb.trim(),
          page_size: labelPageSize,
          display_cod_prepaid: 1,
          display_shipper_mobile: 1,
          display_shipper_address: 1,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.label_url) {
        window.open(json.label_url, "_blank");
        setUtilMsg({ success: true, text: "Shipping Label opened in new tab" });
      } else {
        throw new Error(json.message || "Failed to generate shipment label");
      }
    } catch (err: any) {
      setUtilMsg({ success: false, text: err.message || "Error generating label" });
    } finally {
      setUtilLoading(false);
    }
  };

  const handlePrintInvoice = async () => {
    if (!utilAwb.trim()) return;
    try {
      setUtilLoading(true);
      setUtilMsg(null);
      const res = await fetch(`${API_BASE}/api/logistics/shipping/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awb_numbers: utilAwb.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.invoice_url) {
        window.open(json.invoice_url, "_blank");
        setUtilMsg({ success: true, text: "Official Tax Invoice opened in new tab" });
      } else {
        throw new Error(json.message || "Failed to generate customer invoice");
      }
    } catch (err: any) {
      setUtilMsg({ success: false, text: err.message || "Error generating invoice" });
    } finally {
      setUtilLoading(false);
    }
  };

  // --- 7. NDR (NON-DELIVERY REPORT) ACTIONS STATE ---
  const [ndrAwb, setNdrAwb] = useState("");
  const [ndrAction, setNdrAction] = useState<"1" | "2">("1"); // 1=Reattempt, 2=RTO
  const [ndrDate, setNdrDate] = useState("2026-08-29");
  const [ndrTime, setNdrTime] = useState("14:00:00");
  const [ndrPhone, setNdrPhone] = useState("");
  const [ndrAddress, setNdrAddress] = useState("");
  const [ndrAddrType, setNdrAddrType] = useState("1"); // 1=Home, 2=Office
  const [ndrRemark, setNdrRemark] = useState("Customer requested rescheduling");
  const [ndrLoading, setNdrLoading] = useState(false);
  const [ndrMsg, setNdrMsg] = useState<{ success: boolean; text: string } | null>(null);

  const handleNdrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ndrAwb.trim()) return;
    try {
      setNdrLoading(true);
      setNdrMsg(null);

      const res = await fetch(`${API_BASE}/api/logistics/ndr/add-reattempt-rto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          awb_numbers: ndrAwb.trim(),
          ndr_action: Number(ndrAction),
          reattempt_date: ndrAction === "1" ? ndrDate : undefined,
          reattempt_time: ndrAction === "1" ? ndrTime : undefined,
          reattempt_mobile_number: ndrAction === "1" && ndrPhone ? Number(ndrPhone) : undefined,
          reattempt_address: ndrAction === "1" && ndrAddress ? ndrAddress : undefined,
          reattempt_address_type: ndrAction === "1" ? Number(ndrAddrType) : undefined,
          rto_remark: ndrAction === "2" ? ndrRemark : undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setNdrMsg({ success: true, text: json.message || "NDR action submitted successfully" });
      } else {
        throw new Error(json.message || "NDR action submission failed");
      }
    } catch (err: any) {
      setNdrMsg({ success: false, text: err.message || "Failed to submit NDR action" });
    } finally {
      setNdrLoading(false);
    }
  };

  // Initial loads
  useEffect(() => {
    if (activeTab === "warehouses") {
      fetchWarehouses();
      fetchStates();
    }
    if (activeTab === "stores") {
      fetchStores();
      fetchStoreOrderList();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 text-white">
      
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white text-zinc-950 shadow-md">
              <Truck className="w-5 h-5 text-zinc-950" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Shipping & Logistics Hub</h1>
              <p className="text-xs font-semibold text-zinc-300 mt-0.5">Enterprise courier dispatch console powered by iThink Logistics API v3</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            Gateway Live (Hub 122518)
          </span>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Logistics Engine", value: "iThink v3 API", sub: "Enterprise Multi-Carrier", icon: Layers },
          { label: "Default Origin Hub", value: "Hub ID: 122518", sub: "Chembur, Mumbai (400071)", icon: Building2 },
          { label: "Carrier Network", value: "Air & Surface", sub: "All India Coverage", icon: Truck },
          { label: "Service Protocol", value: "Auto-Assigned", sub: "B2C Surface / Express", icon: ShieldCheck },
        ].map((k) => {
          const IconComponent = k.icon;
          return (
            <div key={k.label} style={cardStyle} className="rounded-2xl p-5 shadow-sm flex items-start justify-between bg-zinc-950/80">
              <div>
                <p className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{k.label}</p>
                <p className="text-lg font-black mt-1 text-white">{k.value}</p>
                <p className="text-xs text-emerald-400 font-bold mt-1">{k.sub}</p>
              </div>
              <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white">
                <IconComponent className="w-4 h-4 text-white" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Tab Navigation */}
      <div className="rounded-2xl p-2 flex flex-wrap gap-2 shadow-sm bg-zinc-950 border border-zinc-800">
        {[
          { id: "tracker", label: "Package Tracker", icon: Search },
          { id: "rates", label: "Rate Calculator", icon: Calculator },
          { id: "pincode", label: "Pincode Check", icon: MapPin },
          { id: "warehouses", label: "Warehouses & Hubs", icon: Building2 },
          { id: "stores", label: "Store Orders Sync", icon: Store },
          { id: "labels", label: "Labels & Invoices", icon: FileText },
          { id: "ndr", label: "NDR Action Center", icon: AlertTriangle },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 flex-1 text-center whitespace-nowrap ${
                isActive
                  ? "bg-white text-zinc-950 shadow-md border border-white"
                  : "bg-zinc-900 text-zinc-200 border border-zinc-800 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <TabIcon className={`w-4 h-4 ${isActive ? "text-zinc-950" : "text-zinc-200"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 1. LIVE TRACKER TAB */}
      {/* ========================================================= */}
      {activeTab === "tracker" && (
        <div style={cardStyle} className="rounded-2xl p-6 shadow-sm space-y-6 bg-zinc-950">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-white">Real-Time Consignment Tracker</h2>
              <p className="text-xs font-bold text-zinc-300 mt-1">
                Retrieve instant milestone scans, transit checkpoints, and courier delivery status.
              </p>
            </div>
            <span className="text-xs text-zinc-200 font-bold bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800 font-mono">
              Multi-AWB Supported
            </span>
          </div>

          <form onSubmit={handleTrack} className="flex gap-3 max-w-2xl">
            <div className="relative flex-1">
              <input
                type="text"
                required
                placeholder="Enter AWB Number (e.g. ITL12345678, 6a90cf00...)"
                value={trackAwb}
                onChange={(e) => setTrackAwb(e.target.value)}
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={trackLoading}
              className="px-6 py-3 bg-white hover:bg-zinc-200 text-zinc-950 font-black rounded-xl text-xs transition-colors flex items-center gap-2 disabled:opacity-50 shadow-md"
            >
              {trackLoading ? <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" /> : <Search className="w-4 h-4 text-zinc-950" />}
              <span>{trackLoading ? "Searching..." : "Track Consignment"}</span>
            </button>
          </form>

          {trackError && (
            <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs text-rose-200 font-bold flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{trackError}</span>
            </div>
          )}

          {trackResult && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-black text-zinc-200 uppercase tracking-wider">Tracking Milestone Records</h3>
              {Object.keys(trackResult).map((awbKey) => {
                const info = trackResult[awbKey];
                const scans = info.scans || info.scan || info.history || [];
                return (
                  <div key={awbKey} className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/60 space-y-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-3">
                      <div>
                        <span className="text-xs text-zinc-400 uppercase font-bold">AWB Consignment Number</span>
                        <p className="text-base font-black text-white font-mono mt-0.5">{awbKey}</p>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-400 uppercase font-bold">Carrier Partner</span>
                        <p className="text-sm font-bold text-white mt-0.5">{info.courier_name || info.courier || "iThink Logistics Partner"}</p>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-400 uppercase font-bold">Consignment State</span>
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            {info.current_status || info.status || "In-Transit"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Milestone Timeline */}
                    <div>
                      <p className="text-xs font-black text-white mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-white" />
                        <span>Checkpoint Scan Timeline</span>
                      </p>
                      {Array.isArray(scans) && scans.length > 0 ? (
                        <div className="relative pl-6 border-l-2 border-zinc-700 space-y-4 ml-2.5 my-3">
                          {scans.map((s: any, idx: number) => (
                            <div key={idx} className="relative">
                              <div className="absolute -left-[31px] top-1 w-3 h-3 bg-white rounded-full border-2 border-zinc-950 shadow-xs" />
                              <p className="text-xs font-black text-white">{s.activity || s.status_detail || s.location || "Checkpoint Verified"}</p>
                              <p className="text-xs font-semibold text-zinc-400 mt-0.5 font-mono">
                                {s.date || s.scan_date_time || ""} {s.location ? `• ${s.location}` : ""}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400 font-bold italic">No historical scan events recorded yet for this consignment.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. RATE & ZONE CALCULATOR TAB */}
      {/* ========================================================= */}
      {activeTab === "rates" && (
        <div style={cardStyle} className="rounded-2xl p-6 shadow-sm space-y-6 bg-zinc-950">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-lg font-black text-white">Freight Rate & Zone Calculator</h2>
            <p className="text-xs font-bold text-zinc-300 mt-1">
              Estimate live shipping costs across Air & Surface carriers based on weight, dimensions, and pincode zones.
            </p>
          </div>

          <form onSubmit={handleCalculateRate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Origin Pincode (Hub)</label>
              <input type="number" required value={fromPin} onChange={(e) => setFromPin(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Destination Pincode</label>
              <input type="number" required value={toPin} onChange={(e) => setToPin(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Dead Weight (kg)</label>
              <input type="number" step="0.01" max="10" required value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Payment Terms</label>
              <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className={inputClass}>
                <option value="Prepaid" className="bg-zinc-900 text-white">Prepaid (Online Payment)</option>
                <option value="COD" className="bg-zinc-900 text-white">Cash on Delivery (COD)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Length (cm)</label>
              <input type="number" max="1000" value={lengthCm} onChange={(e) => setLengthCm(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Width (cm)</label>
              <input type="number" max="1000" value={widthCm} onChange={(e) => setWidthCm(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Height (cm)</label>
              <input type="number" max="1000" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Declared Value (₹)</label>
              <input type="number" value={mrpVal} onChange={(e) => setMrpVal(e.target.value)} className={inputClass} />
            </div>

            <div className="sm:col-span-2 lg:col-span-4 pt-2">
              <button
                type="submit"
                disabled={rateLoading}
                className="px-6 py-3 bg-white hover:bg-zinc-200 text-zinc-950 font-black rounded-xl text-xs shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {rateLoading ? <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" /> : <Calculator className="w-4 h-4 text-zinc-950" />}
                <span>{rateLoading ? "Calculating Freight..." : "Calculate Freight Rates"}</span>
              </button>
            </div>
          </form>

          {rateError && (
            <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs text-rose-200 font-bold flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{rateError}</span>
            </div>
          )}

          {rateResult && (
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-xs text-zinc-300 font-extrabold uppercase tracking-wider">Optimal Freight Rate</p>
                  <p className="text-3xl font-black text-white mt-1 font-mono">₹{rateResult.shippingCharge}</p>
                </div>
                <span className="text-xs bg-emerald-500/15 text-emerald-300 font-black px-3.5 py-1.5 rounded-full border border-emerald-500/30">
                  Best Value Carrier Auto-Assigned
                </span>
              </div>

              {rateResult.rates && (
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2.5">Carrier Price Comparisons</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.keys(rateResult.rates).map((courierKey) => {
                      const c = rateResult.rates[courierKey];
                      return (
                        <div key={courierKey} className="border border-zinc-800 bg-zinc-900/60 p-4 rounded-xl shadow-xs">
                          <p className="font-black text-sm text-white capitalize">{courierKey.replace(/_/g, " ")}</p>
                          <p className="text-lg font-black text-white mt-1 font-mono">₹{c.rate || c.charge || c.total_rate || "N/A"}</p>
                          <p className="text-xs font-bold text-zinc-300 mt-1">Transit Time: {c.expected_delivery || "2-4 Days"}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. PINCODE SERVICEABILITY TAB */}
      {/* ========================================================= */}
      {activeTab === "pincode" && (
        <div style={cardStyle} className="rounded-2xl p-6 shadow-sm space-y-6 bg-zinc-950">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-lg font-black text-white">Pincode Serviceability & COD Validation</h2>
            <p className="text-xs font-bold text-zinc-300 mt-1">
              Verify if a postal code is covered for courier delivery, prepaid dispatch, and COD availability.
            </p>
          </div>

          <form onSubmit={handleCheckPincode} className="flex gap-3 max-w-md">
            <input
              type="number"
              required
              placeholder="Enter 6-digit Pincode (e.g. 400071)"
              value={checkPin}
              onChange={(e) => setCheckPin(e.target.value)}
              className={inputClass}
            />
            <button
              type="submit"
              disabled={pinLoading}
              className="px-6 py-3 bg-white hover:bg-zinc-200 text-zinc-950 font-black rounded-xl text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {pinLoading ? <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" /> : <MapPin className="w-4 h-4 text-zinc-950" />}
              <span>{pinLoading ? "Checking..." : "Verify Pincode"}</span>
            </button>
          </form>

          {pinError && (
            <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs text-rose-200 font-bold flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

          {pinResult && (
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3.5 max-w-md shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <span className="text-xs font-bold text-zinc-300">Coverage Status:</span>
                <span className={`text-xs font-black px-3 py-1 rounded-full inline-flex items-center gap-1.5 ${
                  pinResult.serviceable ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-rose-950/50 text-rose-300 border border-rose-800/80"
                }`}>
                  {pinResult.serviceable ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                  {pinResult.serviceable ? "Serviceable" : "Non-Serviceable"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <span className="text-xs font-bold text-zinc-300">Cash on Delivery (COD):</span>
                <span className="text-xs font-black text-white">{pinResult.cod ? "Available" : "Prepaid Only"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <span className="text-xs font-bold text-zinc-300">District / City:</span>
                <span className="text-xs font-black text-white">{pinResult.city || "Mumbai"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300">State:</span>
                <span className="text-xs font-black text-white">{pinResult.state || "Maharashtra"}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. WAREHOUSES & LOCATIONS TAB */}
      {/* ========================================================= */}
      {activeTab === "warehouses" && (
        <div style={cardStyle} className="rounded-2xl p-6 shadow-sm space-y-6 bg-zinc-950">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-white">Origin Pickup Warehouses</h2>
              <p className="text-xs font-bold text-zinc-300 mt-1">
                Manage dispatch addresses verified and mapped with iThink logistics networks.
              </p>
            </div>
            <button
              onClick={() => setShowAddWh(!showAddWh)}
              className="px-4 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-black rounded-xl transition-colors flex items-center gap-2 shadow-xs"
            >
              <Building2 className="w-4 h-4 text-zinc-950" />
              <span>{showAddWh ? "Close Setup" : "Add Warehouse Location"}</span>
            </button>
          </div>

          {whSuccessMsg && (
            <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{whSuccessMsg}</span>
            </div>
          )}

          {/* Add Warehouse Form */}
          {showAddWh && (
            <form onSubmit={handleAddWarehouse} className="p-6 border border-zinc-800 bg-zinc-900 rounded-2xl space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">New Warehouse Setup</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Facility Name *</label>
                  <input type="text" required value={whCompany} onChange={(e) => setWhCompany(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Mobile Phone *</label>
                  <input type="tel" required placeholder="10-digit mobile" value={whMobile} onChange={(e) => setWhMobile(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Pincode *</label>
                  <input type="number" required value={whPin} onChange={(e) => setWhPin(e.target.value)} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Address Line 1 (Street / Building) *</label>
                  <input type="text" required value={whAddr1} onChange={(e) => setWhAddr1(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Landmark / Area</label>
                  <input type="text" value={whAddr2} onChange={(e) => setWhAddr2(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>State *</label>
                  <select
                    value={selectedStateId}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className={inputClass}
                    required
                  >
                    <option value="" className="bg-zinc-900 text-white">-- Select State --</option>
                    {statesList.map((st: any) => (
                      <option key={st.id || st.state_id} value={st.id || st.state_id} className="bg-zinc-900 text-white">
                        {st.state_name || st.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>City / District *</label>
                  <select
                    value={selectedCityId}
                    onChange={(e) => setSelectedCityId(e.target.value)}
                    className={inputClass}
                    disabled={!selectedStateId}
                    required
                  >
                    <option value="" className="bg-zinc-900 text-white">-- Select City --</option>
                    {citiesList.map((ct: any) => (
                      <option key={ct.id || ct.city_id} value={ct.id || ct.city_id} className="bg-zinc-900 text-white">
                        {ct.city_name || ct.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={whSubmitting}
                className="px-6 py-3 bg-white hover:bg-zinc-200 text-zinc-950 font-black rounded-xl text-xs transition-colors disabled:opacity-50"
              >
                {whSubmitting ? "Submitting Location..." : "Submit Warehouse for Carrier Verification"}
              </button>
            </form>
          )}

          {whLoading ? (
            <p className="text-xs text-white font-bold py-6 text-center">Loading registered warehouses...</p>
          ) : whError ? (
            <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs text-rose-200 font-bold">{whError}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Default Active Hub Card */}
              <div className="p-5 border border-emerald-500/40 bg-emerald-950/20 rounded-2xl space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-400" />
                    <p className="font-black text-sm text-white">ARTIORI (Athena Design Studios)</p>
                  </div>
                  <span className="text-xs font-black px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/40">
                    Pickup Address ID: 122518
                  </span>
                </div>
                <p className="text-xs font-bold text-zinc-300">Plot No 7, Moti Baug, Chembur, Mumbai, Maharashtra - 400071</p>
                <div className="flex items-center gap-4 text-xs text-zinc-200 font-mono pt-1">
                  <span className="flex items-center gap-1 font-bold"><Phone className="w-3.5 h-3.5 text-zinc-400" /> 7304185760</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-black"><CheckCircle2 className="w-3.5 h-3.5" /> Verified Origin Hub</span>
                </div>
              </div>

              {warehouses.filter(w => (w.pickup_address_id || w.id) !== 122518).map((w: any, idx: number) => (
                <div key={idx} className="p-5 border border-zinc-800 bg-zinc-900/60 rounded-2xl space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-black text-sm text-white">{w.company_name || w.name || "Warehouse Location"}</p>
                    <span className="text-xs font-black px-3 py-1 bg-zinc-800 text-zinc-200 rounded-full font-mono border border-zinc-700">
                      ID: {w.pickup_address_id || w.id || w.warehouse_id}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-zinc-300">{w.address1 || w.address}, {w.city}, {w.state} - {w.pincode}</p>
                  <p className="text-xs text-white font-bold font-mono">Phone: {w.mobile || w.phone || "N/A"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. REGISTERED STORES & BULK ORDERS TAB */}
      {/* ========================================================= */}
      {activeTab === "stores" && (
        <div style={cardStyle} className="rounded-2xl p-6 shadow-sm space-y-6 bg-zinc-950">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-lg font-black text-white">Registered Platform Stores & Date Range Manifest</h2>
            <p className="text-xs font-bold text-zinc-300 mt-1">
              Sync orders and cross-reference store manifest records directly with courier server backends.
            </p>
          </div>

          {/* Active Store Card */}
          <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white text-zinc-950 shadow-xs">
                <Store className="w-5 h-5 text-zinc-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white">Artiory Official Store</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase">
                    Active
                  </span>
                </div>
                <p className="text-xs text-zinc-300 font-mono mt-1">
                  Platform Store ID: <span className="font-bold text-white">32474</span> • Domain: <span className="font-bold text-white">https://artiory.com</span>
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-white bg-zinc-800 px-3.5 py-1.5 rounded-xl border border-zinc-700 shadow-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Origin Calculation Linked
            </span>
          </div>

          <div className="flex flex-wrap gap-4 items-end bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800">
            <div>
              <label className={labelClass}>Start Date</label>
              <input type="date" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>End Date</label>
              <input type="date" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} className={inputClass} />
            </div>
            <button
              onClick={fetchStoreOrderList}
              disabled={storeOrdersLoading}
              className="px-6 py-3 bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-black rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-xs"
            >
              {storeOrdersLoading ? <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" /> : <Calendar className="w-4 h-4 text-zinc-950" />}
              <span>{storeOrdersLoading ? "Fetching Orders..." : "Fetch Orders in Range"}</span>
            </button>
          </div>

          {storeOrders.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Orders Retrieved ({storeOrders.length})</h3>
              <div className="overflow-x-auto border border-zinc-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900 text-white font-black border-b border-zinc-800 uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Order No</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Payment</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 bg-zinc-950/60">
                    {storeOrders.map((ord: any, idx: number) => (
                      <tr key={idx} className="hover:bg-zinc-900/60 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-white">{ord.order_no || ord.order || `#ORD-${idx}`}</td>
                        <td className="p-3.5 text-zinc-200 font-bold">{ord.customer_name || ord.name || "Customer"}</td>
                        <td className="p-3.5 font-black text-white font-mono">₹{ord.total_amount || ord.totalPrice || 0}</td>
                        <td className="p-3.5 text-zinc-300 font-bold">{ord.payment_mode || "Prepaid"}</td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 font-black border border-blue-500/30">{ord.status || "Synced"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-400 font-bold italic py-4">No order records found for the selected date range.</p>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. LABELS & INVOICES UTILITY TAB */}
      {/* ========================================================= */}
      {activeTab === "labels" && (
        <div style={cardStyle} className="rounded-2xl p-6 shadow-sm space-y-6 bg-zinc-950">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-lg font-black text-white">Thermal Shipping Labels & Official Tax Invoices</h2>
            <p className="text-xs font-bold text-zinc-300 mt-1">
              Generate standardized barcode shipping labels (A4/A5/A6) and black-and-white print-ready A4 Tax Invoices.
            </p>
          </div>

          <div className="max-w-xl space-y-4">
            <div>
              <label className={labelClass}>Consignment AWB Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. ITL12345678, 6a90cf00..."
                value={utilAwb}
                onChange={(e) => setUtilAwb(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Thermal Label Dimensions</label>
              <div className="flex gap-3">
                {["A4", "A5", "A6"].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setLabelPageSize(sz)}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-black transition-all ${
                      labelPageSize === sz
                        ? "bg-white text-zinc-950 border-white shadow-xs"
                        : "bg-zinc-900 text-zinc-300 border-zinc-700 hover:bg-zinc-800 hover:text-white"
                    }`}
                  >
                    {sz} Standard
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handlePrintLabel}
                disabled={utilLoading || !utilAwb.trim()}
                className="flex-1 py-3 bg-white hover:bg-zinc-200 text-zinc-950 font-black rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Printer className="w-4 h-4 text-zinc-950" />
                <span>{utilLoading ? "Generating Label..." : "Print Shipping Label"}</span>
              </button>
              <button
                onClick={handlePrintInvoice}
                disabled={utilLoading || !utilAwb.trim()}
                className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-black border border-zinc-700 rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FileText className="w-4 h-4 text-white" />
                <span>{utilLoading ? "Generating Invoice..." : "Print A4 Tax Invoice"}</span>
              </button>
            </div>

            {utilMsg && (
              <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
                utilMsg.success ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-rose-950/40 text-rose-300 border border-rose-800/80"
              }`}>
                {utilMsg.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                <span>{utilMsg.text}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. NDR REATTEMPT & RTO TAB */}
      {/* ========================================================= */}
      {activeTab === "ndr" && (
        <div style={cardStyle} className="rounded-2xl p-6 shadow-sm space-y-6 bg-zinc-950">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-lg font-black text-white">NDR (Non-Delivery Report) Action Console</h2>
            <p className="text-xs font-bold text-zinc-300 mt-1">
              Execute immediate operational directives for undelivered shipments: schedule customer reattempt or trigger Return to Origin (RTO).
            </p>
          </div>

          <form onSubmit={handleNdrSubmit} className="max-w-2xl space-y-4">
            <div>
              <label className={labelClass}>Consignment AWB Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. ITL12345678, 6a90cf00..."
                value={ndrAwb}
                onChange={(e) => setNdrAwb(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Resolution Directive *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-black text-white cursor-pointer">
                  <input
                    type="radio"
                    name="ndrAction"
                    value="1"
                    checked={ndrAction === "1"}
                    onChange={() => setNdrAction("1")}
                    className="accent-white w-4 h-4"
                  />
                  <span>1. Schedule Delivery Reattempt</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-black text-rose-400 cursor-pointer">
                  <input
                    type="radio"
                    name="ndrAction"
                    value="2"
                    checked={ndrAction === "2"}
                    onChange={() => setNdrAction("2")}
                    className="accent-rose-500 w-4 h-4"
                  />
                  <span>2. Initiate Return to Origin (RTO)</span>
                </label>
              </div>
            </div>

            {ndrAction === "1" ? (
              <div className="p-5 border border-zinc-800 bg-zinc-900 rounded-2xl space-y-3.5 shadow-xs">
                <p className="text-xs font-black text-white uppercase tracking-wider">Reattempt Logistics Parameters</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className={labelClass}>Target Date (YYYY-MM-DD) *</label>
                    <input type="date" required value={ndrDate} onChange={(e) => setNdrDate(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Preferred Time Slot</label>
                    <input type="time" step="1" value={ndrTime} onChange={(e) => setNdrTime(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Verified Contact Number</label>
                    <input type="tel" placeholder="10-digit mobile" value={ndrPhone} onChange={(e) => setNdrPhone(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Premises Classification</label>
                    <select value={ndrAddrType} onChange={(e) => setNdrAddrType(e.target.value)} className={inputClass}>
                      <option value="1" className="bg-zinc-900 text-white">Residential Address</option>
                      <option value="2" className="bg-zinc-900 text-white">Commercial / Office Address</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Updated Address Clarification</label>
                    <input type="text" placeholder="Building/Flat No, Landmark" value={ndrAddress} onChange={(e) => setNdrAddress(e.target.value)} className={inputClass} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 border border-rose-900/60 bg-rose-950/20 rounded-2xl space-y-3.5 shadow-xs">
                <p className="text-xs font-black text-rose-300 uppercase tracking-wider">RTO Reason Specification</p>
                <div>
                  <label className={labelClass}>Detailed RTO Remark *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Customer cancelled / Unreachable / Refused at doorstep"
                    value={ndrRemark}
                    onChange={(e) => setNdrRemark(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={ndrLoading}
              className={`px-8 py-3 text-white font-bold rounded-xl text-xs shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2 ${
                ndrAction === "1" ? "bg-white text-zinc-950 hover:bg-zinc-200" : "bg-rose-600 hover:bg-rose-700 text-white"
              }`}
            >
              {ndrLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              <span className={ndrAction === "1" ? "text-zinc-950 font-black" : "text-white font-black"}>
                {ndrLoading ? "Submitting Request..." : ndrAction === "1" ? "Confirm Delivery Reattempt" : "Execute RTO Order"}
              </span>
            </button>

            {ndrMsg && (
              <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
                ndrMsg.success ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-rose-950/40 text-rose-300 border border-rose-800/80"
              }`}>
                {ndrMsg.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                <span>{ndrMsg.text}</span>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

