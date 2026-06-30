"use client";

import * as React from "react";
import { showToast } from "@/lib/toast";
import { CustomButton } from "../custom-button";
import { NavigationTabs } from "../navigation-tabs";
import { ConfirmDialog } from "../confirm-dialog";
import { 
  Upload, 
  X, 
  Trash2, 
  Send, 
  Undo, 
  Check, 
  Plus, 
  FileText, 
  MapPin, 
  History, 
  CheckCircle, 
  ChevronRight, 
  Eye, 
  Boxes,
  Clock,
  Pencil
} from "lucide-react";

interface SKUItem {
  sku: string;
  qty: number;
}

interface TrackOrderDraft {
  id: string; // Combined DO_Ref
  doNumber: string;
  refNumber: string;
  mark: string; // A, B, C, D
  type: "Normal" | "Urgent" | "Appointment";
  deliverTo: string;
  poscode: string;
  items: SKUItem[];
  appointmentDate?: string;
  appointmentTimeWindow?: string;
  deadline?: number;
  deliverMethod?: string;
  latitude?: number | string;
  longitude?: number | string;
  pdfImages?: string[];
}

interface LogEntry {
  action: string;
  actionBy: string;
  remark?: string;
  timestamp: number;
  photoUrl?: string;
}

interface DbOrder {
  ID: string;
  DO_Number: string;
  Ref_Number: string;
  Mark: string;
  Type: string;
  Deliver_To: string;
  Poscode: string;
  Items: string; // JSON string of SKUItem[]
  Status: string; // Ready to Pick, Picking, Ready to Deliver, Load, Out for Delivery, Delivered
  Logs: string; // JSON string of LogEntry[]
  Timestamp: number; // Created timestamp
  Delivered_At?: number | string; // Delivered timestamp
  Completed?: string | boolean; // "true" or true when archived by admin
  Deadline?: number | string;
  Deliver_Method?: string;
  Latitude?: number | string;
  Longitude?: number | string;
  Photo_DO_Paper?: string;
  Photo_DO_Paper_Signed?: string;
  Photo_Delivered_Proof?: string;
  Photo_Handover_Proof?: string;
  Photo_Picker_Proof?: string;
}

interface TrackOrderModuleProps {
  profile?: {
    role: string;
    name?: string;
    email?: string;
  } | null;
}

// Singapore coordinate prefix mapping helper
function getSingaporeLatLng(poscode: string): { lat: number; lng: number } {
  let clean = String(poscode || "").trim();
  if (!clean) return { lat: 1.3521, lng: 103.8198 }; // Center of SG
  
  // Pad with leading zero if it's a 5-digit number (e.g. 43956 -> 043956)
  if (/^\d+$/.test(clean)) {
    clean = clean.padStart(6, '0');
  }
  
  if (clean.length < 2) return { lat: 1.3521, lng: 103.8198 };
  const prefix = clean.substring(0, 2);
  const mapping: Record<string, { lat: number; lng: number }> = {
    "01": { lat: 1.277, lng: 103.852 }, "02": { lat: 1.277, lng: 103.852 }, "03": { lat: 1.277, lng: 103.852 },
    "04": { lat: 1.277, lng: 103.852 }, "05": { lat: 1.277, lng: 103.852 }, "06": { lat: 1.277, lng: 103.852 },
    "07": { lat: 1.274, lng: 103.844 }, "08": { lat: 1.274, lng: 103.844 },
    "09": { lat: 1.267, lng: 103.822 }, "10": { lat: 1.267, lng: 103.822 },
    "14": { lat: 1.288, lng: 103.810 }, "15": { lat: 1.288, lng: 103.810 }, "16": { lat: 1.288, lng: 103.810 },
    "11": { lat: 1.292, lng: 103.778 }, "12": { lat: 1.292, lng: 103.778 }, "13": { lat: 1.292, lng: 103.778 },
    "17": { lat: 1.292, lng: 103.778 }, "18": { lat: 1.292, lng: 103.778 }, "19": { lat: 1.292, lng: 103.778 },
    "20": { lat: 1.292, lng: 103.778 }, "21": { lat: 1.292, lng: 103.778 },
    "22": { lat: 1.303, lng: 103.834 }, "23": { lat: 1.303, lng: 103.834 }, "24": { lat: 1.303, lng: 103.834 },
    "25": { lat: 1.303, lng: 103.834 }, "26": { lat: 1.303, lng: 103.834 }, "27": { lat: 1.303, lng: 103.834 },
    "28": { lat: 1.325, lng: 103.839 }, "29": { lat: 1.325, lng: 103.839 }, "30": { lat: 1.325, lng: 103.839 },
    "31": { lat: 1.332, lng: 103.847 }, "32": { lat: 1.332, lng: 103.847 }, "33": { lat: 1.332, lng: 103.847 },
    "34": { lat: 1.325, lng: 103.871 }, "35": { lat: 1.325, lng: 103.871 }, "36": { lat: 1.325, lng: 103.871 }, "37": { lat: 1.325, lng: 103.871 },
    "38": { lat: 1.318, lng: 103.886 }, "39": { lat: 1.318, lng: 103.886 }, "40": { lat: 1.318, lng: 103.886 }, "41": { lat: 1.318, lng: 103.886 },
    "42": { lat: 1.305, lng: 103.905 }, "43": { lat: 1.305, lng: 103.905 }, "44": { lat: 1.305, lng: 103.905 }, "45": { lat: 1.305, lng: 103.905 },
    "46": { lat: 1.324, lng: 103.929 }, "47": { lat: 1.324, lng: 103.929 }, "48": { lat: 1.324, lng: 103.929 },
    "49": { lat: 1.364, lng: 103.991 }, "50": { lat: 1.364, lng: 103.991 },
    "51": { lat: 1.353, lng: 103.944 }, "52": { lat: 1.353, lng: 103.944 },
    "53": { lat: 1.361, lng: 103.886 }, "54": { lat: 1.361, lng: 103.886 }, "55": { lat: 1.361, lng: 103.886 },
    "56": { lat: 1.369, lng: 103.848 }, "57": { lat: 1.369, lng: 103.848 },
    "58": { lat: 1.344, lng: 103.774 }, "59": { lat: 1.344, lng: 103.774 },
    "60": { lat: 1.326, lng: 103.722 }, "61": { lat: 1.326, lng: 103.722 }, "62": { lat: 1.326, lng: 103.722 }, "63": { lat: 1.326, lng: 103.722 }, "64": { lat: 1.326, lng: 103.722 },
    "65": { lat: 1.358, lng: 103.750 }, "66": { lat: 1.358, lng: 103.750 }, "67": { lat: 1.358, lng: 103.750 }, "68": { lat: 1.358, lng: 103.750 },
    "69": { lat: 1.411, lng: 103.705 }, "70": { lat: 1.411, lng: 103.705 }, "71": { lat: 1.411, lng: 103.705 },
    "72": { lat: 1.437, lng: 103.779 }, "73": { lat: 1.437, lng: 103.779 },
    "75": { lat: 1.430, lng: 103.828 }, "76": { lat: 1.430, lng: 103.828 },
    "77": { lat: 1.396, lng: 103.818 }, "78": { lat: 1.396, lng: 103.818 },
    "79": { lat: 1.409, lng: 103.870 }, "80": { lat: 1.409, lng: 103.870 },
    "81": { lat: 1.390, lng: 103.902 }, "82": { lat: 1.390, lng: 103.902 }
  };
  return mapping[prefix] || { lat: 1.3521, lng: 103.8198 };
}

// Validate Singapore Poscode
function validatePoscode(code: any) {
  const clean = String(code || "").trim();
  return /^\d{5,6}$/.test(clean);
}

// Fetch exact coordinates from public Singapore OneMap API
async function fetchPostcodeCoordinates(
  poscode: string,
  baseUrl = "https://www.onemap.gov.sg/api/common/elastic/search",
  token?: string
): Promise<{ lat: number, lng: number } | null> {
  const clean = String(poscode || "").trim();
  if (!clean) return null;
  
  let padded = clean;
  if (/^\d+$/.test(clean)) {
    padded = clean.padStart(6, '0');
  }
  
  try {
    const url = `${baseUrl}?searchVal=${padded}&returnGeom=Y&getAddrDetails=N&pageNum=1`;
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = token;
    }
    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const lat = Number(result.LATITUDE);
        const lng = Number(result.LONGITUDE);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
    }
  } catch (_) {}
  return null;
}

// Load PDF.js dynamically from CDN
async function loadPdfJs(): Promise<any> {
  if ((window as any).pdfjsLib) return (window as any).pdfjsLib;

  return new Promise((resolve, reject) => {
    // Add stylesheet just in case
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
      resolve(pdfjsLib);
    };
    script.onerror = () => reject(new Error("Failed to load PDF.js library"));
    document.head.appendChild(script);
  });
}

// Resolve proof image links dynamically from corresponding DbOrder columns
function getLogImagesForAction(action: string, order: DbOrder): string[] {
  if (!order) return [];
  const act = String(action || "").toLowerCase();
  let val: any = "";
  
  if (act.includes("created") || act.includes("imported") || act.includes("sent")) {
    val = order.Photo_DO_Paper;
  } else if (act.includes("picked") || act.includes("proof")) {
    val = order.Photo_Picker_Proof;
  } else if (act.includes("delivered")) {
    val = order.Photo_Delivered_Proof;
  } else if (act.includes("handover")) {
    val = order.Photo_Handover_Proof;
  } else if (act.includes("signed")) {
    val = order.Photo_DO_Paper_Signed;
  }
  
  if (!val) return [];
  
  try {
    if (typeof val === "string" && (val.startsWith("[") || val.startsWith("{"))) {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
      if (parsed && typeof parsed === "object") {
        return [parsed.url || parsed.uri || ""].filter(Boolean);
      }
    }
  } catch (_) {}
  
  if (typeof val === "string") {
    if (val.includes(",")) {
      return val.split(",").map(v => v.trim()).filter(Boolean);
    }
    return [val.trim()].filter(Boolean);
  }
  
  return [];
}


// Format Unix Timestamp to dd/mm/yyyy hh:mm
function formatTimestamp(ts: any) {
  if (!ts) return "";
  const num = Number(ts);
  if (isNaN(num) || num <= 0) return String(ts);
  const date = new Date(num);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}


// Format YYYY-MM-DD string to dd/mm/yyyy
function formatDateStringToDDMMYYYY(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// Get Unix timestamp for today at 6:00 PM local time
function getUrgentDeadline(): number {
  const d = new Date();
  d.setHours(18, 0, 0, 0); // 6:00 PM
  return d.getTime();
}

// Get Unix timestamp for specific date and end time
function getAppointmentDeadline(dateStr: string, timeStr: string): number {
  if (!dateStr || !timeStr) return 0;
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  const d = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return d.getTime();
}

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function SlidePanel({ isOpen, onClose, title, children, footer }: SlidePanelProps) {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div 
      className={`fixed top-0 right-0 h-screen w-full sm:w-[450px] bg-[#EEEEEE] shadow-2xl border-l border-zinc-300 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex flex-col h-full font-primary">
        {/* Panel Header */}
        <div className="p-4 border-b border-zinc-300 flex items-center justify-between bg-zinc-100 flex-shrink-0">
          <h4 className="text-sm font-bold text-zinc-800 text-left">
            {title}
          </h4>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 cursor-pointer flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 text-xs">
          {children}
        </div>

        {/* Panel Footer */}
        {footer && (
          <div className="p-4 bg-zinc-100 border-t border-zinc-300 flex justify-end gap-2 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function TrackOrderModule({ profile }: TrackOrderModuleProps) {
  const tabs = [
    { id: "pending", label: "Pending" },
    { id: "complete", label: "Complete" },
    { id: "create", label: "Create Order" },
    { id: "return", label: "Return Order" }
  ];

  const [activeTab, setActiveTab] = React.useState<string>("pending");
  const [drafts, setDrafts] = React.useState<TrackOrderDraft[]>([]);
  const [dbOrders, setDbOrders] = React.useState<DbOrder[]>([]);
  const [pdfLoading, setPdfLoading] = React.useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Detail panel / Drawer states
  const [isPanelOpen, setIsPanelOpen] = React.useState<boolean>(false);
  const [panelMode, setPanelMode] = React.useState<"edit" | "view">("view");
  const [panelOrderId, setPanelOrderId] = React.useState<string | null>(null);
  const [panelItems, setPanelItems] = React.useState<SKUItem[]>([]);

  // Create Order panel states
  const [isCreatePanelOpen, setIsCreatePanelOpen] = React.useState<boolean>(false);
  const [createDoNumber, setCreateDoNumber] = React.useState<string>("");
  const [createRefNumber, setCreateRefNumber] = React.useState<string>("");
  const [createMark, setCreateMark] = React.useState<string>("");
  const [createType, setCreateType] = React.useState<"Normal" | "Urgent" | "Appointment">("Normal");
  const [createDeliverTo, setCreateDeliverTo] = React.useState<string>("");
  const [createPoscode, setCreatePoscode] = React.useState<string>("");
  const [createItems, setCreateItems] = React.useState<SKUItem[]>([]);
  const [productSkus, setProductSkus] = React.useState<string[]>([]);
  const [productsDb, setProductsDb] = React.useState<any[]>([]);
  const [createAppointmentDate, setCreateAppointmentDate] = React.useState<string>("");
  const [createTimeWindow, setCreateTimeWindow] = React.useState<string>("");
  const [createDeliverMethod, setCreateDeliverMethod] = React.useState<string>("Company Delivery");
  const [tick, setTick] = React.useState<number>(0);

  // Return Orders panel and display states
  const [stores, setStores] = React.useState<any[]>([]);
  const [showCompleteReturns, setShowCompleteReturns] = React.useState<boolean>(false);
  const [isReturnPanelOpen, setIsReturnPanelOpen] = React.useState<boolean>(false);
  const [editingReturn, setEditingReturn] = React.useState<DbOrder | null>(null);
  const [returnRefNumber, setReturnRefNumber] = React.useState("");
  const [returnLocation, setReturnLocation] = React.useState("");
  const [returnCollectBeforeDate, setReturnCollectBeforeDate] = React.useState("");
  const [returnMark, setReturnMark] = React.useState("R");
  const [returnItems, setReturnItems] = React.useState<SKUItem[]>([]);
  const [storeSearchQuery, setStoreSearchQuery] = React.useState("");
  const [showStoreDropdown, setShowStoreDropdown] = React.useState(false);

  // Logs modal states
  const [isLogsModalOpen, setIsLogsModalOpen] = React.useState<boolean>(false);
  const [logsList, setLogsList] = React.useState<LogEntry[]>([]);
  const [logsTitle, setLogsTitle] = React.useState<string>("");
  const [selectedOrderMark, setSelectedOrderMark] = React.useState<string>("");
  const [selectedOrderId, setSelectedOrderId] = React.useState<string>("");
  const [selectedOrder, setSelectedOrder] = React.useState<DbOrder | null>(null);

  // Lightbox modal state for viewing images in full size
  const [activeLightboxImage, setActiveLightboxImage] = React.useState<string | null>(null);

  // Keyboard shortcut listener to close Lightbox on Escape
  React.useEffect(() => {
    if (!activeLightboxImage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveLightboxImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeLightboxImage]);

  // Revoke confirmation dialog states
  const [isConfirmRevokeOpen, setIsConfirmRevokeOpen] = React.useState<boolean>(false);
  const [pendingRevokeOrder, setPendingRevokeOrder] = React.useState<DbOrder | null>(null);

  // Map Hover / Tooltip state
  const [hoveredPin, setHoveredPin] = React.useState<any | null>(null);

  // Map Panel Open state
  const [isMapOpen, setIsMapOpen] = React.useState<boolean>(false);

  // OneMap API settings from Setting_API
  const [oneMapToken, setOneMapToken] = React.useState<string>("");
  const [oneMapUrl, setOneMapUrl] = React.useState<string>("https://www.onemap.gov.sg/api/common/elastic/search");

  // Leaflet Dynamic Loading and Map Refs
  const [leafletLoaded, setLeafletLoaded] = React.useState<boolean>(false);
  const mapRef = React.useRef<any>(null);
  const markersGroupRef = React.useRef<any>(null);

  // Load Leaflet Script and Stylesheets from CDN
  React.useEffect(() => {
    if (activeTab !== "pending") return;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (!(window as any).L) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => {
        setLeafletLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      setLeafletLoaded(true);
    }
  }, [activeTab]);

  // Fetch stores directory from backend
  const fetchStores = async () => {
    try {
      const res = await fetch("https://ib.hsgglobalpteltd.workers.dev/api/admin/cache?sheet=Store_Retailer_DB");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.value || []);
        setStores(list);
      }
    } catch (_) {}
  };

  // Current User Info
  const currentUser = React.useMemo(() => {
    return profile?.name || profile?.email || "Admin";
  }, [profile]);

  // Fetch drafts, API settings, and product SKUs on mount
  React.useEffect(() => {
    const cachedDrafts = localStorage.getItem("track_order_drafts");
    if (cachedDrafts) {
      try {
        setDrafts(JSON.parse(cachedDrafts));
      } catch (e) {
        console.error("Failed to parse cached drafts", e);
      }
    }
    
    // Fetch OneMap API settings
    fetchSettingApi();
    
    // Quick load from cache for instant UI, followed by live Sheets sync
    fetchDatabaseOrders(false).then(() => {
      fetchDatabaseOrders(true);
    });

    // Load product SKUs for manual order creation
    fetchProductSkus();
    fetchStores();
  }, []);

  // Polling: fetch data direct from Sheets every 60 seconds (active only while TrackOrderModule is open/mounted)
  React.useEffect(() => {
    const interval = setInterval(() => {
      console.log("tracking order...... ");
      fetchDatabaseOrders(true);
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Listen for Escape key to close slide-in drawers
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMapOpen(false);
        setIsCreatePanelOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Tick for countdown timer real-time updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000); // every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Listen for the global db-refresh event (make listening)
  React.useEffect(() => {
    const handleDbRefresh = async () => {
      try {
        await fetchDatabaseOrders(true); // force sync from Sheets
        showToast("Database refreshed successfully!", "success");
      } catch (err: any) {
        showToast("Refresh failed: " + err.message, "error");
      }
    };

    window.addEventListener("db-refresh", handleDbRefresh);
    return () => {
      window.removeEventListener("db-refresh", handleDbRefresh);
    };
  }, []);

  // Fetch API Settings from Google Sheets Setting_API
  const fetchSettingApi = async () => {
    try {
      const res = await fetch("https://ib.hsgglobalpteltd.workers.dev/api/admin/cache?sheet=Setting_API");
      if (res.ok) {
        const list = await res.json();
        const array = Array.isArray(list) ? list : (list.value || []);
        if (array.length > 0) {
          const oneMapApiObj = array.find((a: any) => String(a.ID) === "OneMap_API" || String(a.ID) === "OneMap_Token");
          if (oneMapApiObj && oneMapApiObj.Key) {
            setOneMapToken(oneMapApiObj.Key.trim());
          }
          const oneMapUrlObj = array.find((a: any) => String(a.ID) === "OneMap_URL");
          if (oneMapUrlObj && oneMapUrlObj.Key) {
            setOneMapUrl(oneMapUrlObj.Key.trim());
          }
        }
      }
    } catch (_) {}
  };

  // Fetch database orders from Workers API
  const fetchDatabaseOrders = async (forceSync = false) => {
    try {
      if (forceSync) {
        // Refresh Workers cache from Google Sheets
        await fetch("https://ib.hsgglobalpteltd.workers.dev/api/admin/cache?sheet=Track_Orders", {
          method: "POST"
        });
      }
      const res = await fetch("https://ib.hsgglobalpteltd.workers.dev/api/admin/cache?sheet=Track_Orders");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.value || []);
        setDbOrders(list);
      }
    } catch (e: any) {
      showToast("Failed to fetch database records: " + e.message, "error");
    }
  };

  // Fetch product SKUs list from localStorage or Products DB
  const fetchProductSkus = async () => {
    const cached = localStorage.getItem("products_DB_data");
    if (cached) {
      try {
        const products = JSON.parse(cached);
        setProductsDb(products);
        const skus = products.map((p: any) => p.SKU).filter(Boolean);
        if (skus.length > 0) {
          setProductSkus(skus);
          return;
        }
      } catch (_) {}
    }
    try {
      const res = await fetch("https://ib.hsgglobalpteltd.workers.dev/api/admin/cache?sheet=products_DB");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.value || []);
        localStorage.setItem("products_DB_data", JSON.stringify(list));
        setProductsDb(list);
        const skus = list.map((p: any) => p.SKU).filter(Boolean);
        setProductSkus(skus);
      }
    } catch (_) {}
  };

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createDoNumber) {
      showToast("DO Number is required", "error");
      return;
    }
    if (!createDeliverTo) {
      showToast("Delivery Address is required", "error");
      return;
    }
    if (!createPoscode || !validatePoscode(createPoscode)) {
      showToast("Please enter a valid 6-digit Singapore Postal Code", "error");
      return;
    }
    if (!createMark) {
      showToast("Please assign a Mark (A, B, C, D)", "error");
      return;
    }

    // Check if Mark is active in pending orders
    const isMarkActive = pendingOrders.some(
      (o) => String(o.Mark).toUpperCase() === createMark.toUpperCase()
    );
    if (isMarkActive) {
      showToast(`Mark "${createMark}" is currently active in a pending order.`, "error");
      return;
    }

    // Validation: check if DO Number is already registered in Drafts, Pending, or Completed lists
    const inDrafts = drafts.some((d) => d.doNumber === createDoNumber);
    const inPending = pendingOrders.some((p) => p.DO_Number === createDoNumber);
    const inCompleted = completedOrders.some((c) => c.DO_Number === createDoNumber);

    if (inDrafts || inPending || inCompleted) {
      showToast(`Warning: Order ${createDoNumber} already registered in system. Please check order.`, "error");
      return;
    }

    if (createType === "Appointment") {
      if (!createAppointmentDate) {
        showToast("Appointment Date is required", "error");
        return;
      }
      if (!createTimeWindow) {
        showToast("Appointment End Time is required", "error");
        return;
      }
    }

    const deadlineVal = createType === "Urgent"
      ? getUrgentDeadline()
      : createType === "Appointment"
      ? getAppointmentDeadline(createAppointmentDate, createTimeWindow)
      : 0;

    const newDraft: TrackOrderDraft = {
      id: `${createDoNumber}_${createRefNumber || "NA"}`,
      doNumber: createDoNumber,
      refNumber: createRefNumber,
      mark: createMark,
      type: createType,
      deliverTo: createDeliverTo,
      poscode: createPoscode,
      items: createItems.filter(i => i.sku.trim() !== ""),
      appointmentDate: createType === "Appointment" ? createAppointmentDate : undefined,
      appointmentTimeWindow: createType === "Appointment" ? createTimeWindow : undefined,
      deadline: deadlineVal,
      deliverMethod: createDeliverMethod
    };

    const updated = [...drafts, newDraft];
    saveDraftsToStorage(updated);
    showToast(`Draft for DO ${createDoNumber} created successfully.`, "success");

    // Reset and close
    setIsCreatePanelOpen(false);
    setCreateDoNumber("");
    setCreateRefNumber("");
    setCreateMark("");
    setCreateType("Normal");
    setCreateDeliverTo("");
    setCreatePoscode("");
    setCreateItems([]);
    setCreateAppointmentDate("");
    setCreateTimeWindow("");
    setCreateDeliverMethod("Company Delivery");
  };

  // Filter orders for Pending and Complete lists
  const pendingOrders = React.useMemo(() => {
    return dbOrders.filter(
      (o) => (String(o.Completed) !== "true" && o.Completed !== true) && o.Type !== "Return"
    );
  }, [dbOrders]);

  const completedOrders = React.useMemo(() => {
    return dbOrders.filter(
      (o) => (String(o.Completed) === "true" || o.Completed === true) && o.Type !== "Return"
    );
  }, [dbOrders]);

  // Return Orders filtered lists
  const returnOrders = React.useMemo(() => {
    return dbOrders.filter((o) => {
      if (o.Type !== "Return") return false;
      if (showCompleteReturns) return true;
      return o.Status !== "Complete";
    });
  }, [dbOrders, showCompleteReturns]);

  const sortedReturnOrders = React.useMemo(() => {
    return [...returnOrders].sort((a, b) => {
      const markA = String(a.Mark || "").toUpperCase();
      const markB = String(b.Mark || "").toUpperCase();
      return markA.localeCompare(markB);
    });
  }, [returnOrders]);

  const filteredStores = React.useMemo(() => {
    if (!storeSearchQuery.trim()) return [];
    const q = storeSearchQuery.toLowerCase();
    return stores.filter(s => 
      String(s.ID).toLowerCase().includes(q) || 
      String(s["Display Name"]).toLowerCase().includes(q)
    ).slice(0, 10);
  }, [storeSearchQuery, stores]);

  // Return actions
  const handleDeleteReturnOrder = async (order: DbOrder) => {
    const previousDbOrders = [...dbOrders];
    setDbOrders((prev) => prev.filter((o) => o.ID !== order.ID));
    showToast(`Return order ${order.DO_Number} deleted.`, "info");

    const payload = {
      sheet: "Track_Orders",
      action: "delete",
      data: { ID: order.ID }
    };
    try {
      const res = await fetch("https://ib.hsgglobalpteltd.workers.dev/api/admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchDatabaseOrders(true);
      } else {
        throw new Error();
      }
    } catch (_) {
      setDbOrders(previousDbOrders);
      showToast("Delete failed", "error");
    }
  };

  const handleCompleteReturnOrder = async (order: DbOrder) => {
    let currentLogs: LogEntry[] = [];
    try {
      currentLogs = typeof order.Logs === "string" ? JSON.parse(order.Logs) : order.Logs;
    } catch (_) {}

    const updatedLogs = [
      ...currentLogs,
      {
        action: "Completed by Admin",
        actionBy: currentUser,
        remark: "Return marked as Complete",
        timestamp: Date.now()
      }
    ];

    const previousDbOrders = [...dbOrders];
    setDbOrders((prev) =>
      prev.map((o) =>
        o.ID === order.ID
          ? { ...o, Status: "Complete", Logs: JSON.stringify(updatedLogs) }
          : o
      )
    );

    showToast(`Return order ${order.DO_Number} completed.`, "success");

    const payload = {
      sheet: "Track_Orders",
      action: "update",
      data: {
        ID: order.ID,
        Status: "Complete",
        Logs: JSON.stringify(updatedLogs)
      }
    };

    try {
      const res = await fetch("https://ib.hsgglobalpteltd.workers.dev/api/admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchDatabaseOrders(true);
      } else {
        throw new Error();
      }
    } catch (_) {
      setDbOrders(previousDbOrders);
      showToast("Failed to complete return order.", "error");
    }
  };

  const openCreateReturnPanel = () => {
    setEditingReturn(null);
    setReturnRefNumber("");
    setReturnLocation("");
    setReturnCollectBeforeDate("");
    setReturnMark("");
    setReturnItems([{ sku: "", qty: 1 }]);
    setIsReturnPanelOpen(true);
  };

  const openEditReturnPanel = (order: DbOrder) => {
    setEditingReturn(order);
    setReturnRefNumber(order.Ref_Number || order.DO_Number || "");
    setReturnLocation(order.Deliver_To || "");
    
    if (order.Deadline) {
      const d = new Date(Number(order.Deadline));
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      setReturnCollectBeforeDate(`${yyyy}-${mm}-${dd}`);
    } else {
      setReturnCollectBeforeDate("");
    }
    
    const markVal = order.Mark || "";
    setReturnMark(markVal.startsWith("R") ? markVal.substring(1) : markVal);
    
    let itemsList: SKUItem[] = [];
    try {
      itemsList = typeof order.Items === "string" ? JSON.parse(order.Items) : order.Items;
    } catch (_) {}
    setReturnItems(itemsList.length > 0 ? itemsList : [{ sku: "", qty: 1 }]);
    setIsReturnPanelOpen(true);
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnRefNumber.trim() || !returnLocation.trim() || !returnCollectBeforeDate || !returnMark.trim()) {
      showToast("Please fill in all mandatory fields.", "error");
      return;
    }

    const finalMark = "R" + returnMark.trim().toUpperCase();

    // Validation: Mark cannot be the same if still pending/collected
    const isEdit = !!editingReturn;
    const isMarkActive = dbOrders.some(o => 
      o.Type === "Return" && 
      o.Status !== "Complete" && 
      String(o.Mark).toUpperCase() === finalMark.toUpperCase() &&
      (!isEdit || o.ID !== editingReturn.ID)
    );
    
    if (isMarkActive) {
      showToast(`Mark "${finalMark}" is currently active in another pending/collected return order.`, "error");
      return;
    }

    const orderId = isEdit ? editingReturn.ID : `RET-${Date.now()}`;
    const epochDate = new Date(returnCollectBeforeDate).getTime();
    
    const initialLogs: LogEntry[] = isEdit 
      ? (typeof editingReturn.Logs === "string" ? JSON.parse(editingReturn.Logs) : editingReturn.Logs)
      : [
          {
            action: "Created Return",
            actionBy: currentUser,
            remark: "Initial return creation",
            timestamp: Date.now()
          }
        ];
        
    if (isEdit) {
      initialLogs.push({
        action: "Edited by Admin",
        actionBy: currentUser,
        remark: "Return details updated",
        timestamp: Date.now()
      });
    }

    const payloadData: Partial<DbOrder> = {
      ID: orderId,
      DO_Number: returnRefNumber,
      Ref_Number: returnRefNumber,
      Mark: finalMark,
      Type: "Return",
      Deliver_To: returnLocation,
      Poscode: returnLocation.split(" - ")[0] || "",
      Items: JSON.stringify(returnItems.filter(i => i.sku.trim() !== "")),
      Status: isEdit ? editingReturn.Status : "Pending",
      Logs: JSON.stringify(initialLogs),
      Timestamp: isEdit ? editingReturn.Timestamp : Date.now(),
      Deadline: epochDate,
      Completed: isEdit ? editingReturn.Completed : "false"
    };

    const previousDbOrders = [...dbOrders];
    
    if (isEdit) {
      setDbOrders(prev => prev.map(o => o.ID === orderId ? { ...o, ...payloadData } as DbOrder : o));
    } else {
      setDbOrders(prev => [...prev, payloadData as DbOrder]);
    }

    setIsReturnPanelOpen(false);
    showToast(isEdit ? `Return order ${returnRefNumber} updated.` : `Return order ${returnRefNumber} created.`, "success");

    const payload = {
      sheet: "Track_Orders",
      action: isEdit ? "update" : "insert",
      data: payloadData
    };

    try {
      const res = await fetch("https://ib.hsgglobalpteltd.workers.dev/api/admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchDatabaseOrders(true);
      } else {
        throw new Error();
      }
    } catch (_) {
      setDbOrders(previousDbOrders);
      showToast("Failed to save return order.", "error");
    }
  };

  // Render countdown cell badge
  const renderCountdownCell = (order: DbOrder) => {
    if (!order.Deadline) return <span className="text-zinc-400">—</span>;
    const deadline = Number(order.Deadline);
    if (isNaN(deadline) || deadline <= 0) return <span className="text-zinc-400">—</span>;

    const now = Date.now();
    const diff = deadline - now;

    if (diff <= 0) {
      const absDiff = Math.abs(diff);
      const mins = Math.floor(absDiff / 60000);
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      const timeText = hrs > 0 ? `${hrs}h ${remMins}m` : `${mins}m`;
      return (
        <span className="inline-flex items-center gap-1 font-bold text-red-600 animate-pulse bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[10px]">
          ⚠️ Overdue {timeText}
        </span>
      );
    } else {
      const mins = Math.floor(diff / 60000);
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      const timeText = hrs > 0 ? `${hrs}h ${remMins}m` : `${mins}m`;
      
      if (diff < 2 * 60 * 60 * 1000) {
        return (
          <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px]">
            ⏰ {timeText} left
          </span>
        );
      }
      
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px]">
          ⏱️ {timeText} left
        </span>
      );
    }
  };

  // Render type cell badge or clock icon
  const renderTypeCell = (order: DbOrder) => {
    const val = order.Type || "Normal";
    
    // Calculate countdown string
    let countdownText = "";
    if (order.Deadline) {
      const deadline = Number(order.Deadline);
      if (!isNaN(deadline) && deadline > 0) {
        const now = Date.now();
        const diff = deadline - now;
        if (diff <= 0) {
          const absDiff = Math.abs(diff);
          const mins = Math.floor(absDiff / 60000);
          const hrs = Math.floor(mins / 60);
          const remMins = mins % 60;
          const timeText = hrs > 0 ? `${hrs}h ${remMins}m` : `${mins}m`;
          countdownText = `⚠️ Overdue by ${timeText}`;
        } else {
          const mins = Math.floor(diff / 60000);
          const hrs = Math.floor(mins / 60);
          const remMins = mins % 60;
          const timeText = hrs > 0 ? `${hrs}h ${remMins}m` : `${mins}m`;
          countdownText = `${timeText} remaining`;
        }
      }
    }

    if (val.startsWith("Appointment")) {
      const tooltip = `${val}${countdownText ? `\nCountdown: ${countdownText}` : ""}`;
      return (
        <div className="flex items-center gap-1.5 cursor-help" title={tooltip}>
          <span className="font-semibold text-zinc-800">Appointment</span>
          <Clock size={13} className="text-blue-600 animate-pulse" />
        </div>
      );
    }
    
    if (val === "Urgent") {
      const tooltip = `Urgent (Must be sent today by 6:00 PM)${countdownText ? `\nCountdown: ${countdownText}` : ""}`;
      return (
        <div className="flex items-center gap-1.5 cursor-help" title={tooltip}>
          <span className="font-bold text-red-600">Urgent</span>
          <Clock size={13} className="text-red-500 animate-pulse" />
        </div>
      );
    }
    
    return <span className="text-zinc-500">Normal</span>;
  };

  // Find the next unused capital letter mark character A-Z skipping pending orders & existing drafts
  const getNextAvailableMark = (currentDrafts: TrackOrderDraft[], currentPending: any[], tempAssigned: string[] = []): string => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const usedMarks = new Set<string>();
    
    currentPending.forEach((o) => {
      if (o.Mark) {
        usedMarks.add(String(o.Mark).trim().toUpperCase());
      }
    });

    currentDrafts.forEach((d) => {
      if (d.mark) {
        usedMarks.add(String(d.mark).trim().toUpperCase());
      }
    });

    tempAssigned.forEach((m) => {
      usedMarks.add(m.trim().toUpperCase());
    });

    for (let i = 0; i < alphabet.length; i++) {
      const char = alphabet[i];
      if (!usedMarks.has(char)) {
        return char;
      }
    }
    return "";
  };

  // Get Singapore Zone based on 6-digit postcode (first 2 digits)
  const getZoneFromPostcode = (postcode: string | number): string => {
    if (!postcode) return "Unknown";
    const postcodeStr = postcode.toString().padStart(6, '0');
    const sector = parseInt(postcodeStr.substring(0, 2), 10);
    if (isNaN(sector)) return "Unknown";

    if (sector >= 1 && sector <= 10) return "South";
    if (sector >= 11 && sector <= 33) return "Central";
    if ((sector >= 34 && sector <= 52) || sector === 81) return "East";
    if ((sector >= 53 && sector <= 57) || sector === 79 || sector === 80 || sector === 82) return "North-East";
    if (sector >= 58 && sector <= 71) return "West";
    if (sector >= 72 && sector <= 78) return "North";

    return "Unknown";
  };

  const getZoneBadgeClass = (zone: string): string => {
    if (zone === "North") return "bg-sky-50 text-sky-700 border-sky-200";
    if (zone === "North-East") return "bg-teal-50 text-teal-700 border-teal-200";
    if (zone === "East") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (zone === "South") return "bg-pink-50 text-pink-700 border-pink-200";
    if (zone === "Central") return "bg-purple-50 text-purple-700 border-purple-200";
    if (zone === "West") return "bg-indigo-50 text-indigo-700 border-indigo-200";
    return "bg-zinc-100 text-zinc-700 border-zinc-300";
  };

  const renderPoscodeCell = (poscode: string | number) => {
    const pStr = String(poscode || "").trim();
    if (!pStr) return <span className="text-zinc-400">—</span>;
    const zone = getZoneFromPostcode(pStr);
    const badgeClass = getZoneBadgeClass(zone);

    return (
      <div className="flex items-center justify-center gap-1.5">
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${badgeClass}`}>
          {zone}
        </span>
        <span className="font-normal text-zinc-500">{pStr}</span>
      </div>
    );
  };

  // Carton size lookup helper
  const getCartonSize = (sku: string): number => {
    const product = productsDb.find((p) => p.SKU === sku);
    if (product && product.Carton) {
      const c = Number(product.Carton);
      return isNaN(c) || c <= 0 ? 0 : c;
    }
    return 0;
  };
  
  // Loose carton checker helper
  const hasLooseItems = (sku: string, qty: number): boolean => {
    const cartonSize = getCartonSize(sku);
    if (cartonSize <= 0) return false;
    return qty % cartonSize !== 0;
  };

  // Check draft order items for duplicates or loose carton quantities
  const checkOrderIssues = (items: SKUItem[]) => {
    const skuCounts: Record<string, number> = {};
    let hasDuplicate = false;
    let hasLoose = false;
    
    for (const item of items) {
      if (item.sku) {
        skuCounts[item.sku] = (skuCounts[item.sku] || 0) + 1;
        if (skuCounts[item.sku] > 1) {
          hasDuplicate = true;
        }
        if (hasLooseItems(item.sku, item.qty)) {
          hasLoose = true;
        }
      }
    }
    
    return { hasDuplicate, hasLoose };
  };

  // Singapore Map Pin Construction
  const activePins = React.useMemo(() => {
    const deliveryPins = pendingOrders
      .filter((o) => o.Poscode && validatePoscode(o.Poscode))
      .map((o) => {
        let lat = Number(o.Latitude);
        let lng = Number(o.Longitude);

        // Fallback to static mapping if exact coords not saved or invalid
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
          const coords = getSingaporeLatLng(o.Poscode);
          lat = coords.lat;
          lng = coords.lng;
        }
        
        // Colors & labels corresponding to color groups
        let color = "#9CA3AF"; // Gray
        let textColor = "#18181B"; // Dark text
        let displayStatus = "Preparing Goods";

        if (o.Status === "Ready to Pick" || o.Status === "Picking") {
          color = "#9CA3AF"; // Gray
          textColor = "#18181B";
          displayStatus = "Preparing Goods";
        } else if (o.Status === "Ready to Deliver" || o.Status === "Load") {
          color = "#18181B"; // Black
          textColor = "#FFFFFF"; // Light text
          displayStatus = "Goods Ready";
        } else if (o.Status === "Out for Delivery") {
          color = "#EF4444"; // Red
          textColor = "#FFFFFF";
          displayStatus = "Driver Deliver or Collect Goods";
        } else if (o.Status === "Delivered") {
          color = "#10B981"; // Green
          textColor = "#FFFFFF";
          displayStatus = "Complete Job";
        }
        
        return {
          id: o.ID,
          mark: o.Mark,
          poscode: o.Poscode,
          deliverTo: o.Deliver_To,
          status: displayStatus,
          color,
          textColor,
          lat,
          lng,
          isReturn: false
        };
      });

    const activeReturns = dbOrders.filter((o) => o.Type === "Return" && o.Status !== "Complete");
    const returnPins = activeReturns
      .filter((o) => o.Poscode)
      .map((o) => {
        let lat = Number(o.Latitude);
        let lng = Number(o.Longitude);

        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
          // Try to look up in stores directory
          const matchedStore = stores.find(s => String(s.ID).trim() === String(o.Poscode).trim());
          if (matchedStore && matchedStore["Pin Locations"]) {
            const parts = matchedStore["Pin Locations"].split(",");
            lat = Number(parts[0]);
            lng = Number(parts[1]);
          }
          
          if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            const coords = getSingaporeLatLng(o.Poscode);
            lat = coords.lat;
            lng = coords.lng;
          }
        }

        // Return status colors & labels
        let color = "#EF4444"; // Red for Pending return (Return to Collect)
        let textColor = "#FFFFFF";
        let displayStatus = "Driver Deliver or Collect Goods";

        if (o.Status === "Collected") {
          color = "#10B981"; // Green for Collected return (Complete Job)
          textColor = "#FFFFFF";
          displayStatus = "Complete Job";
        } else if (o.Status === "Pending") {
          color = "#EF4444"; // Red for Pending return (Driver Deliver or Collect Goods)
          textColor = "#FFFFFF";
          displayStatus = "Driver Deliver or Collect Goods";
        } else if (o.Status === "Complete") {
          color = "#10B981"; // Green
          textColor = "#FFFFFF";
          displayStatus = "Complete Job";
        }

        return {
          id: o.ID,
          mark: o.Mark,
          poscode: o.Poscode,
          deliverTo: o.Deliver_To,
          status: displayStatus,
          color,
          textColor,
          lat,
          lng,
          isReturn: true
        };
      });

    return [...deliveryPins, ...returnPins];
  }, [pendingOrders, dbOrders, stores]);

  // Update Leaflet Map markers and focus bounds in real-time
  React.useEffect(() => {
    if (!leafletLoaded || !isMapOpen) return;

    const L = (window as any).L;
    if (!L) return;

    if (!mapRef.current) {
      mapRef.current = L.map("leaflet-map", {
        zoomControl: true,
      }).setView([1.3521, 103.8198], 11);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19
      }).addTo(mapRef.current);

      markersGroupRef.current = L.featureGroup().addTo(mapRef.current);
    }

    const map = mapRef.current;
    const markersGroup = markersGroupRef.current;

    markersGroup.clearLayers();

    // 1. Add Warehouse Pin (postcode: 409461 -> 1.3197, 103.8962) with Home Icon in gray
    const homeIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
    const warehouseIcon = L.divIcon({
      html: `<div style="background-color: #9CA3AF; border: 1px solid white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.25);">${homeIconSvg}</div>`,
      className: "",
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    L.marker([1.3197, 103.8962], { icon: warehouseIcon })
      .addTo(markersGroup);

    // 2. Add Active Order Pins with circular jittering for duplicate locations
    const coordinatesCount: Record<string, number> = {};

    activePins.forEach((pin) => {
      const key = `${pin.lat.toFixed(4)}_${pin.lng.toFixed(4)}`;
      let finalLat = pin.lat;
      let finalLng = pin.lng;

      if (coordinatesCount[key] !== undefined) {
        const count = coordinatesCount[key];
        coordinatesCount[key] = count + 1;

        // Spiral/circular distribution around the base coordinate
        const angle = (count * 2 * Math.PI) / 8; // 8 directions
        const radius = 0.00015 * Math.ceil(count / 8); // shift radius outwards slightly as count increases
        
        finalLat = pin.lat + radius * Math.cos(angle);
        finalLng = pin.lng + radius * Math.sin(angle);
      } else {
        coordinatesCount[key] = 1;
      }

      const customIcon = L.divIcon({
        html: `<div style="background-color: ${pin.color}; border: 1.5px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-family: var(--font-primary, sans-serif); font-size: 10px; font-weight: 900; color: ${pin.textColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.35); line-height: 22px; text-align: center;">${pin.mark}</div>`,
        className: "",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -10]
      });

      L.marker([finalLat, finalLng], { icon: customIcon })
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 11px; line-height: 1.4; color: #18181B; font-weight: 500; min-width: 140px;">
            <b style="font-size: 12px; display: block; border-b: 1px solid #E5E5E5; padding-bottom: 3px; margin-bottom: 4px;">Mark Lot: ${pin.mark}</b>
            <b>Status:</b> ${pin.status}<br/>
            <b>Deliver To:</b> ${pin.deliverTo}<br/>
            <b>Postal Code:</b> ${pin.poscode}
          </div>
        `)
        .addTo(markersGroup);
    });

    // 3. Zoom out to show full Singapore by default
    map.setView([1.3521, 103.8198], 11);

    // Trigger invalidateSize to redraw tiles correctly
    setTimeout(() => {
      map.invalidateSize();
    }, 300);

    // Cleanup: remove map instance when effect re-runs or unmounts (fixes blank map when switching tabs)
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersGroupRef.current = null;
      }
    };
  }, [leafletLoaded, isMapOpen, activePins, activeTab]);

  // Save drafts helper
  const saveDraftsToStorage = (updatedDrafts: TrackOrderDraft[]) => {
    setDrafts(updatedDrafts);
    localStorage.setItem("track_order_drafts", JSON.stringify(updatedDrafts));
  };

  // Handle DO PDF Upload & Parsing
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (file.type !== "application/pdf") {
      showToast("Please upload a valid PDF file", "error");
      return;
    }

    setPdfLoading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64String = (reader.result as string).split(",")[1];
        
        let pdfImages: string[] = [];
        try {
          const pdfjsLib = await loadPdfJs();
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          
          for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            
            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const context = canvas.getContext("2d");
            
            if (context) {
              await page.render({ canvasContext: context, viewport }).promise;
              let quality = 0.8;
              let dataUrl = canvas.toDataURL("image/jpeg", quality);
              while (dataUrl.length > 340000 && quality > 0.15) {
                quality -= 0.1;
                dataUrl = canvas.toDataURL("image/jpeg", quality);
              }
              pdfImages.push(dataUrl);
            }
          }
        } catch (pdfErr) {
          console.error("PDF page rendering failed:", pdfErr);
        }

        try {
          const res = await fetch("https://ib.hsgglobalpteltd.workers.dev/api/admin/parse-do", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pdf: base64String, type: "application/pdf" })
          });

          if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.error || `Server error status ${res.status}`);
          }

          const parsed = await res.json();
          let parsedList = parsed.data;
          if (parsed.success && parsedList && typeof parsedList === "object" && !Array.isArray(parsedList)) {
            if (Array.isArray(parsedList.orders)) {
              parsedList = parsedList.orders;
            } else if (Array.isArray(parsedList.data)) {
              parsedList = parsedList.data;
            } else {
              parsedList = [parsedList];
            }
          }

          console.log("[DO UPLOAD] Raw parsed list from Gemini parser:", parsedList);

          if (parsed.success && Array.isArray(parsedList)) {
            const duplicates: string[] = [];
            const uniqueNewDrafts: TrackOrderDraft[] = [];
            const tempAssignedMarks: string[] = [];
            parsedList.forEach((item: any, idx: number) => {
              const doNum = item.doNumber || `DO-${Date.now()}-${idx}`;
              
              // Validation: check if DO Number is already registered in Drafts, Pending, or Completed lists
              const inDrafts = drafts.some((d) => d.doNumber === doNum);
              const inPending = pendingOrders.some((p) => p.DO_Number === doNum);
              const inCompleted = completedOrders.some((c) => c.DO_Number === doNum);

              if (inDrafts || inPending || inCompleted) {
                duplicates.push(doNum);
              } else {
                const refNum = item.refNumber || "";
                const assignedMark = getNextAvailableMark(drafts, pendingOrders, tempAssignedMarks);
                if (assignedMark) {
                  tempAssignedMarks.push(assignedMark);
                }

                console.log(`[DO UPLOAD] Processing order ${doNum}. pageNumbers:`, item.pageNumbers);

                const itemPageNumbers = Array.isArray(item.pageNumbers) ? item.pageNumbers : [];
                const orderPdfImages = itemPageNumbers.length > 0
                  ? itemPageNumbers.map((pNum: any) => pdfImages[parseInt(pNum, 10) - 1]).filter(Boolean)
                  : pdfImages;

                console.log(`[DO UPLOAD] Order ${doNum} mapped images count: ${orderPdfImages.length}`);

                uniqueNewDrafts.push({
                  id: `${doNum}_${refNum || "NA"}`,
                  doNumber: doNum,
                  refNumber: refNum,
                  mark: assignedMark,
                  type: "Normal",
                  deliverTo: item.deliverTo || "Singapore Address",
                  poscode: item.poscode || "",
                  items: Array.isArray(item.items) ? item.items.map((i: any) => ({
                    sku: i.sku || "Unknown SKU",
                    qty: Number(i.qty) || 1
                  })) : [],
                  appointmentDate: undefined,
                  appointmentTimeWindow: undefined,
                  deliverMethod: "Company Delivery",
                  pdfImages: orderPdfImages
                });
              }
            });

            if (duplicates.length > 0) {
              showToast(`Warning: Order(s) ${duplicates.join(", ")} already registered in system. Please check order.`, "warning");
            }

            if (uniqueNewDrafts.length > 0) {
              const mergedDrafts = [...drafts, ...uniqueNewDrafts];
              saveDraftsToStorage(mergedDrafts);
              showToast(`Successfully read DO. Added ${uniqueNewDrafts.length} orders to drafts.`, "success");
            }
          } else {
            throw new Error("Invalid output format received");
          }
        } catch (e: any) {
          showToast("Failed to read DO: " + e.message, "error");
        } finally {
          setPdfLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };
      reader.onerror = () => {
        throw new Error("Failed to read file buffer");
      };
    } catch (e: any) {
      showToast("File reading error: " + e.message, "error");
      setPdfLoading(false);
    }
  };

  // Draft Cell edits
  const handleUpdateDraftCell = (index: number, field: keyof TrackOrderDraft, value: any) => {
    const updated = drafts.map((draft, idx) => {
      if (idx === index) {
        let cleanVal = value;
        if (field === "mark") {
          // Capitalize & limit to single letter or characters
          cleanVal = String(value).toUpperCase().trim();
        }
        
        const newDraft = { ...draft, [field]: cleanVal };
        
        // Dynamically compute/update deadline
        if (newDraft.type === "Urgent") {
          newDraft.deadline = getUrgentDeadline();
        } else if (newDraft.type === "Appointment") {
          if (newDraft.appointmentDate && newDraft.appointmentTimeWindow) {
            newDraft.deadline = getAppointmentDeadline(newDraft.appointmentDate, newDraft.appointmentTimeWindow);
          } else {
            newDraft.deadline = 0;
          }
        } else {
          newDraft.deadline = 0;
        }
        
        return newDraft;
      }
      return draft;
    });
    saveDraftsToStorage(updated);
  };

  // Delete Draft
  const handleDeleteDraft = (index: number) => {
    const updated = drafts.filter((_, idx) => idx !== index);
    saveDraftsToStorage(updated);
    showToast("Draft deleted", "info");
  };



  // Send Order to Database
  const handleSendOrder = async (index: number) => {
    const order = drafts[index];
    
    if (!order.mark) {
      showToast("Please assign a Mark (A, B, C, D) before sending.", "error");
      return;
    }
    
    if (order.mark.length > 3) {
      showToast("Mark must be 3 characters or less.", "error");
      return;
    }

    if (!order.poscode || !validatePoscode(order.poscode)) {
      showToast("Please input a valid 6-digit Singapore Postal Code.", "error");
      return;
    }

    // Validation: "if mark A still pending, can't use, and all same"
    const isMarkActive = pendingOrders.some(
      (o) => String(o.Mark).toUpperCase() === order.mark.toUpperCase()
    );

    if (isMarkActive) {
      showToast(`Cannot send. Mark "${order.mark}" is currently active in another pending order.`, "error");
      return;
    }

    // Fetch exact coordinates from OneMap API in background before sending
    let lat: number | string = order.latitude || "";
    let lng: number | string = order.longitude || "";
    try {
      const coords = await fetchPostcodeCoordinates(order.poscode, oneMapUrl, oneMapToken);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      }
    } catch (_) {}

    // Upload draft's PDF images to R2 under Track_Orders/DO_Paper/
    let photoDoPaperUrl = "";
    if (order.pdfImages && order.pdfImages.length > 0) {
      showToast(`Uploading DO Paper proof (${order.pdfImages.length} page(s))...`, "info");
      const uploadedUrls: string[] = [];
      for (let i = 0; i < order.pdfImages.length; i++) {
        try {
          const base64Data = order.pdfImages[i].split(",")[1] || order.pdfImages[i];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let j = 0; j < byteCharacters.length; j++) {
            byteNumbers[j] = byteCharacters.charCodeAt(j);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: "image/jpeg" });
          
          const filename = `Track_Orders/DO_Paper/${order.doNumber}_page_${i + 1}_${Date.now()}.jpg`;
          const uploadRes = await fetch(`https://ib.hsgglobalpteltd.workers.dev/api/upload?filename=${encodeURIComponent(filename)}`, {
            method: "POST",
            headers: { "Content-Type": "image/jpeg" },
            body: blob
          });
          if (uploadRes.ok) {
            const uploadResData = await uploadRes.json();
            if (uploadResData.success) {
              uploadedUrls.push(uploadResData.url);
            }
          }
        } catch (uploadErr) {
          console.error("Failed to upload DO Paper page:", uploadErr);
        }
      }
      if (uploadedUrls.length > 0) {
        photoDoPaperUrl = JSON.stringify(uploadedUrls);
      }
    }

    // --- INSTANT UPDATE (OPTIMISTIC UI) ---
    const initialLogs: LogEntry[] = [
      {
        action: "Created & Sent",
        actionBy: currentUser,
        remark: "Initial creation",
        timestamp: Date.now()
      }
    ];

    let finalType: string = order.type;
    if (order.type === "Appointment" && order.appointmentDate && order.appointmentTimeWindow) {
      const formattedDate = formatDateStringToDDMMYYYY(order.appointmentDate);
      finalType = `Appointment (${formattedDate} ${order.appointmentTimeWindow})`;
    }

    let deadlineVal = order.deadline;
    if (order.type === "Urgent" && (!deadlineVal || deadlineVal <= 0)) {
      deadlineVal = getUrgentDeadline();
    }

    const newDbOrder: DbOrder = {
      ID: order.id,
      DO_Number: order.doNumber,
      Ref_Number: order.refNumber || "",
      Mark: order.mark,
      Type: finalType,
      Deliver_To: order.deliverTo,
      Poscode: order.poscode,
      Items: JSON.stringify(order.items),
      Status: "Ready to Pick",
      Logs: JSON.stringify(initialLogs),
      Timestamp: Date.now(),
      Delivered_At: "",
      Completed: "false",
      Deadline: deadlineVal || "",
      Deliver_Method: order.deliverMethod || "Company Delivery",
      Latitude: lat,
      Longitude: lng,
      Photo_DO_Paper: photoDoPaperUrl,
      Photo_DO_Paper_Signed: "",
      Photo_Delivered_Proof: "",
      Photo_Handover_Proof: "",
      Photo_Picker_Proof: ""
    };

    const previousDbOrders = [...dbOrders];
    const previousDrafts = [...drafts];

    // Update state instantly
    setDbOrders((prev) => [...prev, newDbOrder]);
    const remainingDrafts = drafts.filter((_, idx) => idx !== index);
    saveDraftsToStorage(remainingDrafts);

    showToast(`Order ${order.doNumber} sent.`, "info");

    // --- SILENT BACKGROUND UPDATE ---
    const payload = {
      sheet: "Track_Orders",
      action: "insert",
      data: {
        ID: order.id,
        DO_Number: order.doNumber,
        Ref_Number: order.refNumber || "",
        Mark: order.mark,
        Type: finalType,
        Deliver_To: order.deliverTo,
        Poscode: order.poscode,
        Items: JSON.stringify(order.items),
        Status: "Ready to Pick",
        Logs: JSON.stringify(initialLogs),
        Timestamp: Date.now(),
        Delivered_At: "",
        Completed: "false",
        Deadline: deadlineVal || "",
        Deliver_Method: order.deliverMethod || "Company Delivery",
        Latitude: lat,
        Longitude: lng,
        Photo_DO_Paper: photoDoPaperUrl,
        Photo_DO_Paper_Signed: "",
        Photo_Delivered_Proof: "",
        Photo_Handover_Proof: "",
        Photo_Picker_Proof: ""
      }
    };

    fetch("https://ib.hsgglobalpteltd.workers.dev/api/admin/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Server returned status ${res.status}`);
        const result = await res.json();
        if (!result.success) throw new Error(result.error || "Failed to update spreadsheet");

        fetchDatabaseOrders(); // refresh cache quietly
      })
      .catch((err) => {
        // Rollback states on failure
        setDbOrders(previousDbOrders);
        saveDraftsToStorage(previousDrafts);
        showToast("Sync failed: " + err.message + ". Reverted changes.", "error");
      });
  };

  // Revoke Action: Deletes from Sheets and moves back to drafts
  const handleRevokeOrder = (order: DbOrder) => {
    const statusLower = String(order.Status || "").toLowerCase().trim();
    const activeStatuses = ["picking", "ready to deliver", "load", "out for delivery", "delivered"];
    if (activeStatuses.includes(statusLower)) {
      setPendingRevokeOrder(order);
      setIsConfirmRevokeOpen(true);
    } else {
      executeRevokeOrder(order);
    }
  };

  const executeRevokeOrder = async (order: DbOrder) => {
    // --- INSTANT UPDATE (OPTIMISTIC UI) ---
    let parsedItems: SKUItem[] = [];
    try {
      parsedItems = typeof order.Items === "string" ? JSON.parse(order.Items) : order.Items;
    } catch (_) {}

    const restoredDraft: TrackOrderDraft = {
      id: order.ID,
      doNumber: order.DO_Number,
      refNumber: order.Ref_Number,
      mark: order.Mark,
      type: (order.Type as any) || "Normal",
      deliverTo: order.Deliver_To,
      poscode: order.Poscode,
      items: parsedItems
    };

    const previousDbOrders = [...dbOrders];
    const previousDrafts = [...drafts];

    setDbOrders((prev) => prev.filter((o) => o.ID !== order.ID));
    saveDraftsToStorage([...drafts, restoredDraft]);

    showToast(`Order ${order.DO_Number} revoked.`, "info");

    // --- SILENT BACKGROUND UPDATE ---
    const payload = {
      sheet: "Track_Orders",
      action: "delete",
      data: { ID: order.ID }
    };

    fetch("https://ib.hsgglobalpteltd.workers.dev/api/admin/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Server returned status ${res.status}`);
        const result = await res.json();
        if (!result.success) throw new Error(result.error || "Failed to delete record");

        fetchDatabaseOrders(); // refresh cache quietly
      })
      .catch((err) => {
        // Rollback
        setDbOrders(previousDbOrders);
        saveDraftsToStorage(previousDrafts);
        showToast("Revoke failed: " + err.message + ". Reverted changes.", "error");
      });
  };

  // Complete Action: marks Completed = true
  const handleCompleteOrder = async (order: DbOrder) => {
    // --- INSTANT UPDATE (OPTIMISTIC UI) ---
    let currentLogs: LogEntry[] = [];
    try {
      currentLogs = typeof order.Logs === "string" ? JSON.parse(order.Logs) : order.Logs;
    } catch (_) {}

    const updatedLogs = [
      ...currentLogs,
      {
        action: "Completed by Admin",
        actionBy: currentUser,
        remark: "Archived & Verified",
        timestamp: Date.now()
      }
    ];

    const previousDbOrders = [...dbOrders];

    // Update state instantly
    setDbOrders((prev) =>
      prev.map((o) =>
        o.ID === order.ID
          ? { ...o, Completed: "true", Logs: JSON.stringify(updatedLogs) }
          : o
      )
    );

    showToast(`Order ${order.DO_Number} archived.`, "info");

    // --- SILENT BACKGROUND UPDATE ---
    const payload = {
      sheet: "Track_Orders",
      action: "update",
      data: {
        ID: order.ID,
        Completed: "true",
        Logs: JSON.stringify(updatedLogs)
      }
    };

    fetch("https://ib.hsgglobalpteltd.workers.dev/api/admin/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Server returned status ${res.status}`);
        const result = await res.json();
        if (!result.success) throw new Error(result.error || "Failed to update record");

        fetchDatabaseOrders(); // refresh cache quietly
      })
      .catch((err) => {
        // Rollback
        setDbOrders(previousDbOrders);
        showToast("Archive failed: " + err.message + ". Reverted changes.", "error");
      });
  };

  // Items Side Panel Drawer Control
  const openItemsPanel = (mode: "edit" | "view", orderId: string, currentItems: SKUItem[]) => {
    setPanelMode(mode);
    setPanelOrderId(orderId);
    setPanelItems([...currentItems]);
    setIsPanelOpen(true);
  };

  const handleSavePanelItems = () => {
    if (panelMode === "edit" && panelOrderId) {
      // Find and update drafts
      const updatedDrafts = drafts.map((d) => {
        if (d.id === panelOrderId) {
          return { ...d, items: panelItems.filter((i) => i.sku.trim() !== "") };
        }
        return d;
      });
      saveDraftsToStorage(updatedDrafts);
      showToast("Items updated", "success");
    }
    setIsPanelOpen(false);
  };

  const handleUpdatePanelItemRow = (idx: number, field: keyof SKUItem, value: any) => {
    const updated = panelItems.map((item, index) => {
      if (index === idx) {
        return { ...item, [field]: field === "qty" ? Math.max(1, Number(value)) : value };
      }
      return item;
    });
    setPanelItems(updated);
  };

  const handleAddPanelItemRow = () => {
    setPanelItems([...panelItems, { sku: "", qty: 1 }]);
  };

  const handleDeletePanelItemRow = (idx: number) => {
    setPanelItems(panelItems.filter((_, index) => index !== idx));
  };

  // View Logs Dialog
  const handleOpenLogs = (order: DbOrder) => {
    let list: LogEntry[] = [];
    try {
      list = typeof order.Logs === "string" ? JSON.parse(order.Logs) : order.Logs;
    } catch (_) {}
    setLogsList(list);
    setSelectedOrderMark(order.Mark || "-");
    setSelectedOrderId(order.ID || "-");
    setSelectedOrder(order);
    setIsLogsModalOpen(true);
  };



  // Sort Pending Orders alphabetically by Mark A-Z
  const sortedPendingOrders = React.useMemo(() => {
    return [...pendingOrders].sort((a, b) => {
      const markA = String(a.Mark || "").toUpperCase();
      const markB = String(b.Mark || "").toUpperCase();
      return markA.localeCompare(markB);
    });
  }, [pendingOrders]);

  // Helper to truncate text to 15 words
  const truncateWords = (text: string, count = 15) => {
    if (!text) return "";
    const words = text.split(/\s+/);
    if (words.length <= count) return text;
    return words.slice(0, count).join(" ") + "...";
  };

  // Helper to truncate text to N characters
  const truncateCharacters = (text: string, limit = 14) => {
    if (!text) return "";
    if (text.length <= limit) return text;
    return text.substring(0, limit) + "...";
  };

  return (
    <div className="flex flex-col gap-6 relative min-h-[600px]">
      
      {/* Top Banner and Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-300/40 pb-px">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 font-primary text-sm font-bold border-b-2 transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? "border-zinc-950 text-zinc-950"
                  : "border-transparent text-zinc-400 hover:text-zinc-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action controls (Upload Button for Create Order & Track on Map for Pending) */}
        <div className="flex items-center gap-3">
          {activeTab === "create" && (
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
              <CustomButton 
                variant="default"
                onClick={() => fileInputRef.current?.click()}
                disabled={pdfLoading}
                className="relative overflow-hidden bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-700 font-bold"
              >
                <Upload size={14} />
                Import Order
                {pdfLoading && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 animate-[pulse_1s_infinite]" />
                )}
              </CustomButton>
              <CustomButton 
                variant="default"
                onClick={() => {
                  setCreateDoNumber(`DO-${Date.now()}`);
                  setCreateRefNumber("");
                  setCreateMark(getNextAvailableMark(drafts, pendingOrders));
                  setCreateType("Normal");
                  setCreateDeliverTo("");
                  setCreatePoscode("");
                  setCreateItems([]);
                  setIsCreatePanelOpen(true);
                }}
              >
                <Plus size={14} />
                Create Order
              </CustomButton>
            </div>
          )}
          {activeTab === "pending" && (
            <CustomButton variant="default" onClick={() => setIsMapOpen(true)}>
              <MapPin size={14} />
              Track on Map
            </CustomButton>
          )}
          {activeTab === "return" && (
            <CustomButton 
              variant="default"
              onClick={openCreateReturnPanel}
            >
              <Plus size={14} />
              Create Return
            </CustomButton>
          )}
        </div>
      </div>

      {/* TAB CONTENT: CREATE ORDER */}
      {activeTab === "create" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-primary text-base font-bold text-zinc-800">
              Draft Delivery Orders
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-600">
              {drafts.length} Drafts
            </span>
          </div>

          <div className="h-[500px] w-full relative">
            {drafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full bg-[#E5E5E5]/20 border border-dashed border-zinc-300 rounded-lg select-none">
                <FileText size={40} className="text-zinc-400 mb-3" />
                <span className="font-primary text-sm text-zinc-500 font-medium">
                  No draft orders. Upload a Delivery Order PDF to get started.
                </span>
              </div>
            ) : (
              <div className="h-full overflow-auto border border-zinc-300 rounded-lg bg-[#EEEEEE]/10">
                <table className="w-full text-left font-primary text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#E5E5E5] text-zinc-700 font-bold border-b border-zinc-300 h-12">
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-20 align-middle z-10"></th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-16 text-center align-middle z-10">Mark</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-56 align-middle z-10">DO & Ref Number</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-36 align-middle z-10">Type</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-40 align-middle z-10">Deliver To</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-28 text-center align-middle z-10">Poscode</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-40 align-middle z-10">Method</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-20 text-center align-middle z-10">Items</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {drafts.map((draft, idx) => (
                      <tr 
                        key={draft.id} 
                        className={`transition-all ${
                          idx % 2 === 0 ? "bg-[#FFFFFF]" : "bg-[#F8F9FA]"
                        } hover:bg-[#E5E5E5]/20`}
                      >
                        <td className="p-3 w-20 align-middle flex items-center gap-1.5 border-b border-zinc-200">
                          <CustomButton
                            variant="secondary"
                            onClick={() => handleSendOrder(idx)}
                            title="Send to Sheets"
                            className="w-8 h-8 !px-0 flex items-center justify-center aspect-square"
                          >
                            <Send size={12} className="text-emerald-600" />
                          </CustomButton>
                          <CustomButton
                            variant="danger"
                            onClick={() => handleDeleteDraft(idx)}
                            title="Delete Draft"
                            className="w-8 h-8 !px-0 flex items-center justify-center aspect-square"
                          >
                            <Trash2 size={12} />
                          </CustomButton>
                        </td>
                        <td className="p-3 w-16 text-center align-middle border-b border-zinc-200">
                          <input
                            type="text"
                            maxLength={3}
                            value={draft.mark}
                            placeholder="A/B/C..."
                            onChange={(e) => handleUpdateDraftCell(idx, "mark", e.target.value)}
                            className="w-full h-7 px-2 rounded border border-zinc-300/40 hover:border-zinc-300 bg-transparent font-bold text-center text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                          />
                        </td>
                        <td className="p-3 w-56 font-semibold text-zinc-800 align-middle border-b border-zinc-200">
                          {draft.doNumber}
                          {draft.refNumber ? `_${draft.refNumber}` : ""}
                        </td>
                        <td className="p-3 w-36 align-middle border-b border-zinc-200">
                          <div className="flex flex-col gap-1">
                            <select
                              value={draft.type}
                              onChange={(e) => handleUpdateDraftCell(idx, "type", e.target.value)}
                              className="w-full h-7 px-2 rounded border border-zinc-300/40 hover:border-zinc-300 bg-transparent font-normal text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                            >
                              <option value="Normal">Normal</option>
                              <option value="Urgent">Urgent</option>
                              <option value="Appointment">Appointment</option>
                            </select>
                            {draft.type === "Appointment" && (
                              <div className="flex flex-col gap-1 mt-1">
                                <input
                                  type="date"
                                  value={draft.appointmentDate || ""}
                                  onChange={(e) => handleUpdateDraftCell(idx, "appointmentDate", e.target.value)}
                                  className="w-full h-7 px-2 rounded border border-zinc-300/40 bg-transparent text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 text-[10px]"
                                />
                                <input
                                  type="time"
                                  value={draft.appointmentTimeWindow || ""}
                                  onChange={(e) => handleUpdateDraftCell(idx, "appointmentTimeWindow", e.target.value)}
                                  className="w-full h-7 px-2 rounded border border-zinc-300/40 bg-transparent text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 text-[10px]"
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3 w-40 text-zinc-500 align-middle border-b border-zinc-200" title={draft.deliverTo}>
                          {truncateCharacters(draft.deliverTo)}
                        </td>
                        <td className="p-3 w-28 align-middle border-b border-zinc-200">
                          <input
                            type="text"
                            maxLength={6}
                            value={draft.poscode}
                            placeholder="Poscode"
                            onChange={(e) => handleUpdateDraftCell(idx, "poscode", e.target.value)}
                            className={`w-full h-7 px-2 rounded border text-center focus:outline-none focus:ring-1 focus:ring-zinc-400 ${
                              draft.poscode && !validatePoscode(draft.poscode)
                                ? "border-red-400 bg-red-50 text-red-700 font-medium"
                                : "border-zinc-300/40 hover:border-zinc-300 bg-transparent text-zinc-500 font-normal"
                            }`}
                          />
                        </td>
                        <td className="p-3 w-40 align-middle border-b border-zinc-200">
                          <select
                            value={draft.deliverMethod || "Company Delivery"}
                            onChange={(e) => handleUpdateDraftCell(idx, "deliverMethod", e.target.value)}
                            className="w-full h-7 px-2 rounded border border-zinc-300/40 hover:border-zinc-300 bg-transparent font-normal text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                          >
                            <option value="Company Delivery">Company Delivery</option>
                            <option value="External Delivery">External Delivery</option>
                            <option value="Warehouse Pickup">Warehouse Pickup</option>
                          </select>
                        </td>
                        <td className="p-3 w-20 text-center align-middle border-b border-zinc-200">
                          {(() => {
                            const { hasDuplicate, hasLoose } = checkOrderIssues(draft.items);
                            let btnStyle = "bg-[#EEEEEE] border-zinc-300 text-zinc-700 hover:bg-[#E5E5E5]";
                            let tooltip = "Edit Items List";
                            if (hasDuplicate) {
                              btnStyle = "bg-red-50 border-red-300 text-red-750 hover:bg-red-100 animate-pulse";
                              tooltip = "Warning: Duplicate SKU in order! Click to resolve.";
                            } else if (hasLoose) {
                              btnStyle = "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100";
                              tooltip = "Warning: Loose carton quantities detected! Click to resolve.";
                            }
                            return (
                              <button
                                type="button"
                                onClick={() => openItemsPanel("edit", draft.id, draft.items)}
                                title={tooltip}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border transition-all font-semibold cursor-pointer ${btnStyle}`}
                              >
                                <Boxes size={14} />
                                <span>{draft.items.reduce((acc, curr) => acc + curr.qty, 0)}</span>
                              </button>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: PENDING */}
      {activeTab === "pending" && (
        <div className="flex flex-col gap-4">
          
          {/* Left Table Section (Full 100% width) */}
          <div className="flex justify-between items-center px-1">
            <h3 className="font-primary text-base font-bold text-zinc-800">
              Active Deliveries
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-600">
                {sortedPendingOrders.length} Pending
              </span>
            </div>
          </div>

          <div className="h-[500px] w-full relative">
            {sortedPendingOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full bg-[#E5E5E5]/20 border border-dashed border-zinc-300 rounded-lg select-none">
                <Boxes size={40} className="text-zinc-400 mb-3" />
                <span className="font-primary text-sm text-zinc-500 font-medium">
                  No pending deliveries. Create and send orders from the Create tab.
                </span>
              </div>
            ) : (
              <div className="h-full overflow-auto border border-zinc-300 rounded-lg bg-[#EEEEEE]/10">
                <table className="w-full text-left font-primary text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#E5E5E5] text-zinc-700 font-bold border-b border-zinc-300 h-12">
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-20 align-middle z-10"></th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-36 align-middle z-10">Status</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-16 text-center align-middle z-10">Mark</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-56 align-middle z-10">DO & Ref Number</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-36 align-middle z-10">Type</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-36 align-middle z-10">Deliver To</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-28 text-center align-middle z-10">Poscode</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-36 align-middle z-10">Method</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-20 text-center align-middle z-10">Items</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-16 text-center align-middle z-10">Logs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {sortedPendingOrders.map((order, idx) => {
                      let itemsCount = 0;
                      let parsedItems: SKUItem[] = [];
                      try {
                        parsedItems = typeof order.Items === "string" ? JSON.parse(order.Items) : order.Items;
                        itemsCount = parsedItems.reduce((acc: number, curr: SKUItem) => acc + curr.qty, 0);
                      } catch (_) {}

                      // Map status labels to styling
                      let statusBadge = "bg-zinc-100 text-zinc-700 border-zinc-300";
                      if (order.Status === "Ready to Pick") {
                        statusBadge = "bg-blue-50 text-blue-700 border-blue-200";
                      } else if (order.Status === "Picking") {
                        statusBadge = "bg-amber-50 text-amber-700 border-amber-200";
                      } else if (order.Status === "Ready to Deliver") {
                        statusBadge = "bg-indigo-50 text-indigo-700 border-indigo-200";
                      } else if (order.Status === "Load") {
                        statusBadge = "bg-purple-50 text-purple-700 border-purple-200";
                      } else if (order.Status === "Out for Delivery") {
                        statusBadge = "bg-pink-50 text-pink-700 border-pink-200";
                      } else if (order.Status === "Delivered") {
                        statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-200";
                      }

                      return (
                        <tr 
                          key={order.ID} 
                          className={`transition-all h-14 ${
                            idx % 2 === 0 ? "bg-[#FFFFFF]" : "bg-[#F8F9FA]"
                          } hover:bg-[#E5E5E5]/20`}
                        >
                          <td className="p-3 w-20 align-middle flex items-center gap-1.5 h-14 border-b border-zinc-200">
                            <CustomButton
                              variant="secondary"
                              onClick={() => handleRevokeOrder(order)}
                              title="Revoke and send back to drafts"
                              className="w-8 h-8 !px-0 flex items-center justify-center aspect-square"
                            >
                              <Undo size={12} className="text-zinc-600" />
                            </CustomButton>
                            <CustomButton
                              variant="default"
                              onClick={() => handleCompleteOrder(order)}
                              disabled={order.Status !== "Delivered"}
                              title={order.Status !== "Delivered" ? "Cannot complete until status is Delivered" : "Verify and archive"}
                              className="w-8 h-8 !px-0 flex items-center justify-center aspect-square"
                            >
                              <CheckCircle size={12} className="text-emerald-600" />
                            </CustomButton>
                          </td>
                          <td className="p-3 w-36 align-middle border-b border-zinc-200">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold ${statusBadge}`}>
                              {order.Status || "Ready to Pick"}
                            </span>
                          </td>
                          <td className="p-3 w-16 text-center font-semibold text-zinc-800 align-middle border-b border-zinc-200">
                            {order.Mark}
                          </td>
                          <td className="p-3 w-56 font-semibold text-zinc-800 align-middle border-b border-zinc-200">
                            {order.DO_Number}
                            {order.Ref_Number ? `_${order.Ref_Number}` : ""}
                          </td>
                          <td className="p-3 w-36 align-middle border-b border-zinc-200">
                            {renderTypeCell(order)}
                          </td>
                          <td className="p-3 w-36 text-zinc-500 align-middle border-b border-zinc-200" title={order.Deliver_To}>
                            {truncateCharacters(order.Deliver_To)}
                          </td>
                          <td className="p-3 w-28 text-center text-zinc-500 align-middle border-b border-zinc-200">
                            {renderPoscodeCell(order.Poscode)}
                          </td>
                          <td className="p-3 w-36 align-middle border-b border-zinc-200 text-zinc-500">
                            {order.Deliver_Method || "Company Delivery"}
                          </td>
                          <td className="p-3 w-20 text-center align-middle border-b border-zinc-200">
                            <button
                              type="button"
                              onClick={() => openItemsPanel("view", order.ID, parsedItems)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EEEEEE] border border-zinc-300 hover:bg-[#E5E5E5] transition-all font-semibold text-zinc-700 cursor-pointer"
                            >
                              <Boxes size={12} className="text-zinc-500" />
                              <span>{itemsCount}</span>
                            </button>
                          </td>
                          <td className="p-3 w-16 text-center align-middle border-b border-zinc-200">
                            <button
                              type="button"
                              onClick={() => handleOpenLogs(order)}
                              className="p-1 rounded hover:bg-zinc-200 text-zinc-600 hover:text-zinc-950 transition-all cursor-pointer"
                            >
                              <History size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Slide-in Map Panel Drawer (65% screen width) */}
          <div 
            className={`fixed top-0 right-0 h-screen w-[65vw] bg-[#EEEEEE] shadow-2xl border-l border-zinc-300 z-50 transform transition-transform duration-300 ease-in-out ${
              isMapOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex flex-col h-full">
              {/* Panel Header */}
              <div className="p-4 border-b border-zinc-300 flex items-center justify-between bg-zinc-100 font-primary">
                <div>
                  <h4 className="font-primary text-sm font-bold text-zinc-800">
                    Track Orders
                  </h4>
                </div>
                <button
                  onClick={() => setIsMapOpen(false)}
                  className="p-1 rounded hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Panel Map Area */}
              <div className="flex-1 relative bg-[#E0E0E0] overflow-hidden">
                <div id="leaflet-map" className="w-full h-full z-10" />
                {!leafletLoaded && (
                  <div className="absolute inset-0 bg-[#E0E0E0] flex items-center justify-center z-20">
                    <span className="font-primary text-xs text-zinc-500 font-semibold animate-pulse">
                      Loading Map...
                    </span>
                  </div>
                )}
              </div>

              {/* Map Legend */}
              <div className="p-4 border-t border-zinc-300 bg-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-3 font-primary">
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-zinc-650 font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#9CA3AF] border border-zinc-400" />
                    <span>Preparing Goods</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#18181B] border border-zinc-700" />
                    <span>Goods Ready</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] border border-red-500" />
                    <span>Driver Deliver or Collect Goods</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] border border-emerald-600" />
                    <span>Complete Job</span>
                  </div>
                </div>

                <CustomButton variant="secondary" onClick={() => setIsMapOpen(false)}>
                  Close Map
                </CustomButton>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: COMPLETE */}
      {activeTab === "complete" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-primary text-base font-bold text-zinc-800">
              Archived & Delivered Orders
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-600">
              {completedOrders.length} Completed
            </span>
          </div>

          <div className="h-[500px] w-full relative">
            {completedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full bg-[#E5E5E5]/20 border border-dashed border-zinc-300 rounded-lg select-none">
                <CheckCircle size={40} className="text-zinc-400 mb-3" />
                <span className="font-primary text-sm text-zinc-500 font-medium">
                  No completed orders. Archive deliveries from the Pending tab.
                </span>
              </div>
            ) : (
              <div className="h-full overflow-auto border border-zinc-300 rounded-lg bg-[#EEEEEE]/10">
                <table className="w-full text-left font-primary text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#E5E5E5] text-zinc-700 font-bold border-b border-zinc-300 h-12">
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-40 align-middle z-10">Delivered (date time)</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-36 align-middle z-10">Status</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-20 text-center align-middle z-10">Mark</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-56 align-middle z-10">DO & Ref Number</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-36 align-middle z-10">Deliver To</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-28 text-center align-middle z-10">Poscode</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-36 align-middle z-10">Method</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-20 text-center align-middle z-10">Items</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-16 text-center align-middle z-10">Logs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {completedOrders.map((order, idx) => {
                      let itemsCount = 0;
                      let parsedItems: SKUItem[] = [];
                      try {
                        parsedItems = typeof order.Items === "string" ? JSON.parse(order.Items) : order.Items;
                        itemsCount = parsedItems.reduce((acc: number, curr: SKUItem) => acc + curr.qty, 0);
                      } catch (_) {}

                      // Get the Delivered timestamp (when the driver changed it to Delivered)
                      // If no Delivered_At is saved separately, fallback to logs or when admin completed it.
                      let deliveredTs = order.Delivered_At;
                      if (!deliveredTs) {
                        // Attempt to search logs for "Delivered" status timestamp
                        let logsArr: LogEntry[] = [];
                        try {
                          logsArr = typeof order.Logs === "string" ? JSON.parse(order.Logs) : order.Logs;
                          const match = logsArr.find((l) => l.action.toLowerCase() === "delivered" || l.action.includes("Delivered"));
                          if (match) deliveredTs = match.timestamp;
                        } catch (_) {}
                      }
                      if (!deliveredTs) {
                        // Fallback to order completed timestamp
                        deliveredTs = order.Timestamp; 
                      }

                      return (
                        <tr 
                          key={order.ID} 
                          className={`transition-all h-14 ${
                            idx % 2 === 0 ? "bg-[#FFFFFF]" : "bg-[#F8F9FA]"
                          } hover:bg-[#E5E5E5]/20`}
                        >
                          <td className="p-3 w-40 font-semibold text-zinc-700 align-middle border-b border-zinc-200">
                            {formatTimestamp(deliveredTs)}
                          </td>
                          <td className="p-3 w-36 align-middle border-b border-zinc-200">
                            <span className="inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                              Delivered
                            </span>
                          </td>
                          <td className="p-3 w-20 text-center font-semibold text-zinc-800 align-middle border-b border-zinc-200">
                            {order.Mark}
                          </td>
                          <td className="p-3 w-56 font-semibold text-zinc-950 align-middle border-b border-zinc-200">
                            {order.DO_Number}
                            {order.Ref_Number ? `_${order.Ref_Number}` : ""}
                          </td>
                          <td className="p-3 w-36 text-zinc-500 align-middle border-b border-zinc-200" title={order.Deliver_To}>
                            {truncateCharacters(order.Deliver_To)}
                          </td>
                          <td className="p-3 w-28 text-center text-zinc-500 align-middle border-b border-zinc-200">
                            {renderPoscodeCell(order.Poscode)}
                          </td>
                          <td className="p-3 w-36 align-middle border-b border-zinc-200 text-zinc-500">
                            {order.Deliver_Method || "Company Delivery"}
                          </td>
                          <td className="p-3 w-20 text-center align-middle border-b border-zinc-200">
                            <button
                              type="button"
                              onClick={() => openItemsPanel("view", order.ID, parsedItems)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EEEEEE] border border-zinc-300 hover:bg-[#E5E5E5] transition-all font-semibold text-zinc-700 cursor-pointer"
                            >
                              <Boxes size={12} className="text-zinc-500" />
                              <span>{itemsCount}</span>
                            </button>
                          </td>
                          <td className="p-3 w-16 text-center align-middle border-b border-zinc-200">
                            <button
                              type="button"
                              onClick={() => handleOpenLogs(order)}
                              className="p-1 rounded hover:bg-zinc-200 text-zinc-600 hover:text-zinc-950 transition-all cursor-pointer"
                            >
                              <History size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: RETURN ORDER */}
      {activeTab === "return" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-primary text-base font-bold text-zinc-800">
              Return Orders
            </h3>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-650 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showCompleteReturns}
                  onChange={(e) => setShowCompleteReturns(e.target.checked)}
                  className="rounded border-zinc-300 text-zinc-800 focus:ring-zinc-400 w-3.5 h-3.5"
                />
                Show Complete
              </label>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-600">
                {sortedReturnOrders.length} Returns
              </span>
            </div>
          </div>

          <div className="h-[500px] w-full relative">
            {sortedReturnOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full bg-[#E5E5E5]/20 border border-dashed border-zinc-300 rounded-lg select-none">
                <Boxes size={40} className="text-zinc-400 mb-3" />
                <span className="font-primary text-sm text-zinc-500 font-medium">
                  No return orders found. Click Create Return to start.
                </span>
              </div>
            ) : (
              <div className="h-full overflow-auto border border-zinc-300 rounded-lg bg-[#EEEEEE]/10">
                <table className="w-full text-left font-primary text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#E5E5E5] text-zinc-700 font-bold border-b border-zinc-300 h-12">
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-28 align-middle z-10"></th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-16 text-center align-middle z-10">Mark</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-32 align-middle z-10">Status</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-44 align-middle z-10">Ref Number</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-56 align-middle z-10">Return Collect from</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-32 align-middle z-10">Due Date</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-20 text-center align-middle z-10">Items</th>
                      <th className="sticky top-0 bg-[#E5E5E5] p-3 w-16 text-center align-middle z-10">Logs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {sortedReturnOrders.map((order, idx) => {
                      let itemsCount = 0;
                      let parsedItems: SKUItem[] = [];
                      try {
                        parsedItems = typeof order.Items === "string" ? JSON.parse(order.Items) : order.Items;
                        itemsCount = parsedItems.reduce((acc: number, curr: SKUItem) => acc + curr.qty, 0);
                      } catch (_) {}

                      // Map status labels to styling
                      let statusBadge = "bg-zinc-100 text-zinc-700 border-zinc-300";
                      if (order.Status === "Pending") {
                        statusBadge = "bg-amber-50 text-amber-700 border-amber-200";
                      } else if (order.Status === "Collected") {
                        statusBadge = "bg-blue-50 text-blue-700 border-blue-200";
                      } else if (order.Status === "Complete") {
                        statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-200";
                      }

                      // Format epoch date to dd/mm/yyyy
                      const formatDateStr = (ts: any) => {
                        if (!ts) return "—";
                        const d = new Date(Number(ts));
                        const day = String(d.getDate()).padStart(2, "0");
                        const month = String(d.getMonth() + 1).padStart(2, "0");
                        const year = d.getFullYear();
                        return `${day}/${month}/${year}`;
                      };

                      return (
                        <tr 
                          key={order.ID} 
                          className={`transition-all h-14 ${
                            idx % 2 === 0 ? "bg-[#FFFFFF]" : "bg-[#F8F9FA]"
                          } hover:bg-[#E5E5E5]/20`}
                        >
                          <td className="p-3 w-28 align-middle flex items-center gap-1.5 h-14 border-b border-zinc-200">
                            <button
                              type="button"
                              onClick={() => handleDeleteReturnOrder(order)}
                              title="Delete Return"
                              className="w-7 h-7 flex items-center justify-center rounded border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer transition-all outline-none"
                            >
                              <Trash2 size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditReturnPanel(order)}
                              title="Edit Return"
                              className="w-7 h-7 flex items-center justify-center rounded border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700 cursor-pointer transition-all outline-none"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCompleteReturnOrder(order)}
                              disabled={order.Status === "Complete"}
                              title={order.Status === "Complete" ? "Return is already complete" : "Mark as Complete"}
                              className={`w-7 h-7 flex items-center justify-center rounded border transition-all outline-none ${
                                order.Status === "Complete" 
                                  ? "border-zinc-200 bg-zinc-50 text-zinc-450 cursor-not-allowed opacity-50"
                                  : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 cursor-pointer"
                              }`}
                            >
                              <CheckCircle size={12} />
                            </button>
                          </td>
                          <td className="p-3 w-16 text-center font-bold text-zinc-800 align-middle border-b border-zinc-200">
                            {order.Mark}
                          </td>
                          <td className="p-3 w-32 align-middle border-b border-zinc-200">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold ${statusBadge}`}>
                              {order.Status || "Pending"}
                            </span>
                          </td>
                          <td className="p-3 w-44 font-semibold text-zinc-850 align-middle border-b border-zinc-200">
                            {order.Ref_Number || order.DO_Number}
                          </td>
                          <td className="p-3 w-56 text-zinc-700 font-semibold align-middle border-b border-zinc-200" title={order.Deliver_To}>
                            {truncateCharacters(order.Deliver_To, 12)}
                          </td>
                          <td className="p-3 w-32 text-zinc-700 font-semibold align-middle border-b border-zinc-200">
                            {formatDateStr(order.Deadline)}
                          </td>
                          <td className="p-3 w-20 text-center align-middle border-b border-zinc-200">
                            <button
                              type="button"
                              onClick={() => openItemsPanel("view", order.ID, parsedItems)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EEEEEE] border border-zinc-300 hover:bg-[#E5E5E5] transition-all font-semibold text-zinc-700 cursor-pointer"
                            >
                              <Boxes size={12} className="text-zinc-500" />
                              <span>{itemsCount}</span>
                            </button>
                          </td>
                          <td className="p-3 w-16 text-center align-middle border-b border-zinc-200">
                            <button
                              type="button"
                              onClick={() => handleOpenLogs(order)}
                              className="p-1 rounded hover:bg-zinc-200 text-zinc-600 hover:text-zinc-950 transition-all cursor-pointer"
                            >
                              <History size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RIGHT SLIDE-IN PANEL (Drawer) */}
      <SlidePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title={`Track Order Items : ${panelOrderId}`}
        footer={
          <>
            <CustomButton variant="secondary" onClick={() => setIsPanelOpen(false)}>
              Cancel
            </CustomButton>
            {panelMode === "edit" && (
              <CustomButton variant="dark" onClick={handleSavePanelItems}>
                Save Changes
              </CustomButton>
            )}
          </>
        }
      >
        {panelMode === "edit" ? (
          // EDIT MODE
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-zinc-700">SKU / Item List</span>
              <CustomButton variant="secondary" onClick={handleAddPanelItemRow}>
                <Plus size={12} />
                Add Item
              </CustomButton>
            </div>

            <div className="flex flex-col gap-2">
              {(() => {
                const skuCounts = panelItems.reduce((acc, curr) => {
                  if (curr.sku) {
                    acc[curr.sku] = (acc[curr.sku] || 0) + 1;
                  }
                  return acc;
                }, {} as Record<string, number>);

                return panelItems.map((item, idx) => {
                  const isDup = item.sku && skuCounts[item.sku] > 1;
                  const isLoose = item.sku && hasLooseItems(item.sku, item.qty);
                  const cSize = item.sku ? getCartonSize(item.sku) : 0;

                  let cardClass = "border-zinc-300 bg-white";
                  let warningText = null;
                  
                  if (isDup) {
                    cardClass = "border-red-400 bg-red-50 text-red-900";
                    warningText = <span className="text-[10px] text-red-650 font-bold block mt-0.5">⚠️ Duplicate SKU in order</span>;
                  } else if (isLoose) {
                    cardClass = "border-amber-400 bg-amber-50 text-amber-900";
                    warningText = <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">⚠️ Loose quantity (Carton size: {cSize})</span>;
                  }

                  return (
                    <div key={idx} className={`flex flex-col p-2.5 rounded border shadow-xs transition-all ${cardClass}`}>
                      <div className="flex gap-2 items-center">
                        <div className="flex-1 min-w-0">
                          {item.sku ? (
                            <span className="text-xs font-semibold text-zinc-800 block truncate" title={item.sku}>
                              {item.sku}
                            </span>
                          ) : (
                            <select
                              value={item.sku}
                              onChange={(e) => handleUpdatePanelItemRow(idx, "sku", e.target.value)}
                              className="w-full h-8 px-2 rounded border border-zinc-300 text-xs bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-semibold"
                            >
                              <option value="">Select SKU...</option>
                              {productSkus.map((sku) => (
                                <option key={sku} value={sku}>
                                  {sku}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div className="w-16 flex-shrink-0">
                          <input
                            type="number"
                            min={1}
                            value={item.qty}
                            onChange={(e) => handleUpdatePanelItemRow(idx, "qty", e.target.value)}
                            className="w-full h-8 px-2 rounded border border-zinc-300 text-xs text-center bg-white text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-bold"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeletePanelItemRow(idx)}
                          className="p-1 rounded hover:bg-zinc-200 text-zinc-500 hover:text-zinc-850 cursor-pointer flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {warningText}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        ) : (
          // READ ONLY VIEW MODE
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-zinc-700 border-b border-zinc-200 pb-1 mb-1">
              Products List
            </span>
            
            <div className="flex flex-col gap-2">
              {panelItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white px-3 py-2.5 rounded border border-zinc-300">
                  <span className="text-xs font-semibold text-zinc-800">{item.sku}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700">
                    Qty: {item.qty}
                  </span>
                </div>
              ))}

              {panelItems.length === 0 && (
                <p className="text-xs text-zinc-400 italic text-center">
                  No items specified.
                </p>
              )}
            </div>
          </div>
        )}
      </SlidePanel>

      {/* VIEW LOGS SLIDE-IN PANEL (Drawer) */}
      <SlidePanel
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        title={`Track Order Logs : ${selectedOrderId}`}
        footer={
          <CustomButton variant="dark" onClick={() => setIsLogsModalOpen(false)}>
            Close
          </CustomButton>
        }
      >
        {logsList.length === 0 ? (
          <p className="text-center text-zinc-500 italic py-6">No logs recorded.</p>
        ) : (
          <div className="relative pl-32 ml-4">
            {/* Vertical timeline line */}
            <div className="absolute left-[139px] top-2 bottom-2 w-0.5 bg-zinc-200" />

            <div className="flex flex-col gap-8">
              {logsList.map((log, index) => (
                <div key={index} className="relative flex items-start">
                  
                  {/* Left side: datetime */}
                  <div className="absolute -left-[144px] w-28 text-right pr-4 text-[10px] text-zinc-400 font-semibold pt-0.5">
                    {formatTimestamp(log.timestamp)}
                  </div>

                  {/* Center: Dot timeline */}
                  <div className="absolute left-[3px] top-1.5 w-3 h-3 rounded-full bg-zinc-400 border-2 border-white z-10 shadow-xs" />

                  {/* Right side: Action details */}
                  <div className="pl-6 flex-1 flex flex-col gap-1.5">
                    <div className="font-bold text-zinc-800 text-sm text-left">
                      {log.action} <span className="font-normal text-zinc-500 text-xs">by</span> <span className="text-zinc-700 text-xs">{log.actionBy}</span>
                    </div>

                    {log.remark && (
                      <p className="text-zinc-600 bg-zinc-50 p-2.5 rounded border border-zinc-200 text-[11px] font-medium leading-relaxed text-left max-w-full select-text">
                        {log.remark}
                      </p>
                    )}

                    {selectedOrder ? (
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {getLogImagesForAction(log.action, selectedOrder).map((url, imgIdx) => (
                          <div 
                            key={imgIdx} 
                            onClick={() => setActiveLightboxImage(url)}
                            className="rounded-lg overflow-hidden border border-zinc-300 max-w-[240px] shadow-sm bg-white cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-zinc-400 active:scale-[0.98]"
                          >
                            <img 
                              src={url} 
                              alt="Proof Confirmation" 
                              className="object-cover w-full h-36" 
                            />
                          </div>
                        ))}
                      </div>
                    ) : log.photoUrl ? (
                      <div 
                        onClick={() => setActiveLightboxImage(log.photoUrl || null)}
                        className="mt-1.5 rounded-lg overflow-hidden border border-zinc-300 max-w-[240px] shadow-sm bg-white cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-zinc-400 active:scale-[0.98]"
                      >
                        <img 
                          src={log.photoUrl} 
                          alt="Delivery Confirmation" 
                          className="object-cover w-full h-36" 
                        />
                      </div>
                    ) : null}
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}
      </SlidePanel>

      {/* CREATE ORDER SLIDE-IN PANEL (Drawer) */}
      <SlidePanel
        isOpen={isCreatePanelOpen}
        onClose={() => setIsCreatePanelOpen(false)}
        title="Create New Track Order"
        footer={
          <>
            <CustomButton variant="secondary" onClick={() => setIsCreatePanelOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton 
              variant="dark" 
              onClick={(e) => handleCreateOrderSubmit(e)}
              disabled={!createDoNumber || !createDeliverTo || !createPoscode || !createMark}
            >
              Add to Drafts
            </CustomButton>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-bold text-zinc-700">DO Number *</label>
            <input
              type="text"
              placeholder="e.g. DO-20260627-01"
              value={createDoNumber}
              onChange={(e) => setCreateDoNumber(e.target.value)}
              className="h-8 px-2.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-zinc-700">Ref Number (Optional)</label>
            <input
              type="text"
              placeholder="e.g. REF-987"
              value={createRefNumber}
              onChange={(e) => setCreateRefNumber(e.target.value)}
              className="h-8 px-2.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <label className="font-bold text-zinc-700">Mark (A/B/C/D) *</label>
              <input
                type="text"
                maxLength={3}
                placeholder="e.g. A"
                value={createMark}
                onChange={(e) => setCreateMark(e.target.value.toUpperCase().trim())}
                className="h-8 px-2.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 text-center font-bold"
              />
            </div>

            <div className="flex-1 flex flex-col gap-1">
              <label className="font-bold text-zinc-700">Type *</label>
              <select
                value={createType}
                onChange={(e) => setCreateType(e.target.value as any)}
                className="h-8 px-2.5 rounded border border-zinc-300 bg-white text-zinc-850 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-semibold"
              >
                <option value="Normal">Normal</option>
                <option value="Urgent">Urgent</option>
                <option value="Appointment">Appointment</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-zinc-700">Deliver Method *</label>
            <select
              value={createDeliverMethod}
              onChange={(e) => setCreateDeliverMethod(e.target.value)}
              className="h-8 px-2.5 rounded border border-zinc-300 bg-white text-zinc-850 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-semibold"
            >
              <option value="Company Delivery">Company Delivery</option>
              <option value="External Delivery">External Delivery</option>
              <option value="Warehouse Pickup">Warehouse Pickup</option>
            </select>
          </div>

          {createType === "Appointment" && (
            <div className="flex gap-3 border-l-2 border-zinc-400 pl-2.5 my-1">
              <div className="flex-1 flex flex-col gap-1">
                <label className="font-bold text-zinc-700">Appointment Date *</label>
                <input
                  type="date"
                  value={createAppointmentDate}
                  onChange={(e) => setCreateAppointmentDate(e.target.value)}
                  className="h-8 px-2 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-semibold"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <label className="font-bold text-zinc-700">End Time *</label>
                <input
                  type="time"
                  value={createTimeWindow}
                  onChange={(e) => setCreateTimeWindow(e.target.value)}
                  className="h-8 px-2.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-semibold"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="font-bold text-zinc-700">Deliver To Address *</label>
            <textarea
              placeholder="Enter Singapore delivery address"
              value={createDeliverTo}
              onChange={(e) => setCreateDeliverTo(e.target.value)}
              rows={2}
              className="p-2.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium resize-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-zinc-700">Singapore Postal Code *</label>
            <input
              type="text"
              maxLength={6}
              placeholder="6-digit postal code"
              value={createPoscode}
              onChange={(e) => setCreatePoscode(e.target.value)}
              className={`h-8 px-2.5 rounded border text-center font-semibold focus:outline-none focus:ring-1 focus:ring-zinc-400 ${
                createPoscode && !validatePoscode(createPoscode)
                  ? "border-red-400 bg-red-50 text-red-700"
                  : "border-zinc-300 bg-white text-zinc-900"
              }`}
            />
          </div>

          {/* Items Section */}
          <div className="flex flex-col gap-2 border-t border-zinc-300 pt-3 mt-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-zinc-700">SKU / Items List</span>
              <button
                type="button"
                onClick={() => setCreateItems([...createItems, { sku: "", qty: 1 }])}
                className="px-2 py-1 rounded bg-[#E5E5E5] hover:bg-[#D5D5D5] border border-zinc-300 flex items-center gap-1 font-semibold text-zinc-700 cursor-pointer"
              >
                <Plus size={12} />
                Add SKU
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {createItems.map((item, idx) => (
                <div key={idx} className="flex gap-1.5 items-center bg-white p-2 rounded border border-zinc-300 shadow-xs">
                  <div className="flex-1 min-w-0">
                    {productSkus.length === 0 ? (
                      <input
                        type="text"
                        value={item.sku}
                        placeholder="SKU Name"
                        onChange={(e) => {
                          const updated = [...createItems];
                          updated[idx].sku = e.target.value;
                          setCreateItems(updated);
                        }}
                        className="w-full h-8 px-2 rounded border border-zinc-300 text-xs bg-white text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-semibold"
                      />
                    ) : (
                      <select
                        value={item.sku}
                        onChange={(e) => {
                          const updated = [...createItems];
                          updated[idx].sku = e.target.value;
                          setCreateItems(updated);
                        }}
                        className="w-full h-8 px-2 rounded border border-zinc-300 text-xs bg-white text-zinc-850 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-semibold"
                      >
                        <option value="">Select SKU...</option>
                        {productSkus.map((sku) => (
                          <option key={sku} value={sku}>
                            {sku}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="w-16">
                    <input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(e) => {
                        const updated = [...createItems];
                        updated[idx].qty = Math.max(1, Number(e.target.value));
                        setCreateItems(updated);
                      }}
                      className="w-full h-8 px-2 rounded border border-zinc-300 text-xs text-center bg-white text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-semibold"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setCreateItems(createItems.filter((_, index) => index !== idx))}
                    className="p-1.5 rounded hover:bg-red-50 text-red-500 hover:text-red-700 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {createItems.length === 0 && (
                <p className="text-[10px] text-zinc-400 italic text-center py-2">
                  No items added. Click Add SKU.
                </p>
              )}
            </div>
          </div>
        </div>
      </SlidePanel>

      {/* CREATE/EDIT RETURN SLIDE-IN PANEL (Drawer) */}
      <SlidePanel
        isOpen={isReturnPanelOpen}
        onClose={() => setIsReturnPanelOpen(false)}
        title={editingReturn ? `Edit Return Order : ${returnRefNumber}` : "Create New Return Order"}
        footer={
          <>
            <CustomButton variant="secondary" onClick={() => setIsReturnPanelOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton 
              variant="dark" 
              onClick={(e) => handleReturnSubmit(e)}
              disabled={!returnRefNumber || !returnLocation || !returnCollectBeforeDate || !returnMark}
            >
              {editingReturn ? "Save Changes" : "Create Return"}
            </CustomButton>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-bold text-zinc-700">Ref Number (ID) *</label>
            <input
              type="text"
              placeholder="e.g. REF-20260629-01"
              value={returnRefNumber}
              onChange={(e) => setReturnRefNumber(e.target.value)}
              className="h-8 px-2.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium"
            />
          </div>

          <div className="flex flex-col gap-1 relative">
            <label className="font-bold text-zinc-700">Return Location (Store or Postcode) *</label>
            <input
              type="text"
              placeholder="Type postcode or store ID/name..."
              value={returnLocation}
              onChange={(e) => {
                setReturnLocation(e.target.value);
                setStoreSearchQuery(e.target.value);
                setShowStoreDropdown(true);
              }}
              onFocus={() => setShowStoreDropdown(true)}
              className="h-8 px-2.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium"
            />
            {showStoreDropdown && filteredStores.length > 0 && (
              <div className="absolute top-10 left-0 right-0 bg-white border border-zinc-300 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
                {filteredStores.map((store, i) => (
                  <button
                    key={i}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 border-b border-zinc-100 last:border-0 cursor-pointer"
                    onClick={() => {
                      setReturnLocation(`${store.ID} - ${store["Display Name"]}`);
                      setShowStoreDropdown(false);
                    }}
                  >
                    {store.ID} - {store["Display Name"]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <label className="font-bold text-zinc-700">Collect Before Date *</label>
              <input
                type="date"
                value={returnCollectBeforeDate}
                onChange={(e) => setReturnCollectBeforeDate(e.target.value)}
                className="h-8 px-2 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-semibold"
              />
            </div>

            <div className="flex-1 flex flex-col gap-1">
              <label className="font-bold text-zinc-700">Mark *</label>
              <div className="flex items-center">
                <span className="bg-zinc-100 border border-r-0 border-zinc-300 rounded-l h-8 px-3 flex items-center font-bold text-zinc-500 text-sm select-none">
                  R
                </span>
                <input
                  type="text"
                  maxLength={2}
                  placeholder="e.g. A"
                  value={returnMark}
                  onChange={(e) => setReturnMark(e.target.value.toUpperCase().trim())}
                  className="w-full h-8 px-2.5 rounded-r border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 text-center font-bold"
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="flex flex-col gap-2 border-t border-zinc-300 pt-3 mt-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-zinc-700">SKU / Items to Return</span>
              <button
                type="button"
                onClick={() => setReturnItems([...returnItems, { sku: "", qty: 1 }])}
                className="px-2 py-1 rounded bg-[#E5E5E5] hover:bg-[#D5D5D5] border border-zinc-300 flex items-center gap-1 font-semibold text-zinc-700 cursor-pointer"
              >
                <Plus size={12} />
                Add SKU
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {returnItems.map((item, idx) => (
                <div key={idx} className="flex gap-1.5 items-center bg-white p-2 rounded border border-zinc-300 shadow-xs">
                  <div className="flex-1 min-w-0">
                    {productSkus.length === 0 ? (
                      <input
                        type="text"
                        value={item.sku}
                        placeholder="SKU Name"
                        onChange={(e) => {
                          const updated = [...returnItems];
                          updated[idx].sku = e.target.value;
                          setReturnItems(updated);
                        }}
                        className="w-full h-8 px-2 rounded border border-zinc-300 text-xs bg-white text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-semibold"
                      />
                    ) : (
                      <select
                        value={item.sku}
                        onChange={(e) => {
                          const updated = [...returnItems];
                          updated[idx].sku = e.target.value;
                          setReturnItems(updated);
                        }}
                        className="w-full h-8 px-2 rounded border border-zinc-300 text-xs bg-white text-zinc-850 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-semibold"
                      >
                        <option value="">Select SKU...</option>
                        {productSkus.map((sku) => (
                          <option key={sku} value={sku}>
                            {sku}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="w-16">
                    <input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(e) => {
                        const updated = [...returnItems];
                        updated[idx].qty = Math.max(1, Number(e.target.value));
                        setReturnItems(updated);
                      }}
                      className="w-full h-8 px-2 rounded border border-zinc-300 text-xs text-center bg-white text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-semibold"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setReturnItems(returnItems.filter((_, index) => index !== idx))}
                    className="p-1.5 rounded hover:bg-red-50 text-red-500 hover:text-red-700 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {returnItems.length === 0 && (
                <p className="text-[10px] text-zinc-400 italic text-center py-2">
                  No items added. Click Add SKU.
                </p>
              )}
            </div>
          </div>
        </div>
      </SlidePanel>

      <ConfirmDialog
        open={isConfirmRevokeOpen}
        onOpenChange={setIsConfirmRevokeOpen}
        title="Revoke Order Confirmation"
        description={`This order (${pendingRevokeOrder?.DO_Number || "N/A"}) is currently "${pendingRevokeOrder?.Status || ""}" (in progress or completed by picker). Revoking it will delete the order and return it to Drafts. Are you sure you want to revoke this order?`}
        confirmText="Revoke Order"
        cancelText="Keep Order"
        variant="danger"
        onConfirm={() => {
          if (pendingRevokeOrder) {
            executeRevokeOrder(pendingRevokeOrder);
            setPendingRevokeOrder(null);
          }
        }}
        onCancel={() => {
          setPendingRevokeOrder(null);
        }}
      />

      {/* LIGHTBOX MODAL */}
      {activeLightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
          onClick={() => setActiveLightboxImage(null)}
        >
          {/* Close Button */}
          <button 
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all duration-200 backdrop-blur-md border border-white/10 shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
            onClick={() => setActiveLightboxImage(null)}
            aria-label="Close image preview"
          >
            <X size={20} />
          </button>

          {/* Image Container with Zoom/Click-through prevention */}
          <div 
            className="relative max-w-5xl max-h-[85vh] w-auto h-auto flex flex-col items-center justify-center animate-zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={activeLightboxImage} 
              alt="Proof full screen" 
              className="max-w-full max-h-[80vh] rounded-lg object-contain shadow-2xl border border-zinc-800"
            />
            
            {/* Action Bar (Download/View original) */}
            <div className="flex gap-3 mt-4">
              <a 
                href={activeLightboxImage} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/25 rounded-full transition-all duration-200 backdrop-blur-sm shadow-md cursor-pointer"
              >
                <Eye size={14} /> Open in New Tab
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
