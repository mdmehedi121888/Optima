"use client";

import { useEffect, useState } from "react";
import { StatusItem } from "./StatusItem";
import { OperatorModal } from "../settings/operators/OperatorModal";
import { DowntimeModal } from "../downtime/DowntimeModal";
import { DowntimeRecordsModal } from "../downtime/DowntimeRecordsModal";
import { ProductModal } from "../settings/products/ProductModal";
import { ProductRecordsModal } from "../settings/products/ProductRecordsModal";
import { ScrapModal } from "../settings/scrap/ScrapModal";
import { ScrapRecordsModal } from "../settings/scrap/ScrapRecordsModal";
import { Clock, Users, RefreshCw, Zap, Trash, Mail } from "lucide-react";

interface Shift {
  shiftName: string;
}

interface Operator {
  id: number;
  userId: string;
  userName: string;
  userImage: string;
}

interface Product {
  id: number;
  productName: string;
  productCode: string;
  productGroup: string;
  cycleTime: string;
  unitsPerSensorSignal: string;
  stations: string;
}

interface StatusCounts {
  operators: number;
  productChangeover: number;
  downtime: number;
  speedLoss: number;
  scrap: number;
  mail: number;
}

interface DowntimeFormData {
  id?: number;
  startTime: string;
  endTime: string;
  problem_group: string;
  problem_name: string;
  location: string;
  planned_status: "planned" | "unplanned";
}

interface ProductRecord {
  id?: number;
  productId: string;
  productName: string;
  startTime: string;
  endTime: string;
  stations: string;
  shift: string;
}

interface ScrapFormData {
  id?: number;
  start_time: string;
  end_time: string;
  scrap_qty: number;
  scrap_reason: string;
  production_date: string;
  shift: string;
  station: string;
  location: string;
  creator: string;
  is_active?: number;
  sys_date_time?: string;
  updated_at?: string | null;
}

export function StatusBar({ stations, shift }: { stations: string; shift: Shift | null }) {
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    operators: 0,
    productChangeover: 0,
    downtime: 0,
    speedLoss: 0,
    scrap: 0,
    mail: 0,
  });
  const [operators, setOperators] = useState<Operator[]>([]);
  const [downtimeRecords, setDowntimeRecords] = useState<DowntimeFormData[]>([]);
  const [productRecords, setProductRecords] = useState<ProductRecord[]>([]);
  const [scrapRecords, setScrapRecords] = useState<ScrapFormData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showOperatorModal, setShowOperatorModal] = useState(false);
  const [showProductRecordsModal, setShowProductRecordsModal] = useState(false);
  const [showProductFormModal, setShowProductFormModal] = useState(false);
  const [showDowntimeRecordsModal, setShowDowntimeRecordsModal] = useState(false);
  const [showDowntimeFormModal, setShowDowntimeFormModal] = useState(false);
  const [showScrapRecordsModal, setShowScrapRecordsModal] = useState(false);
  const [showScrapFormModal, setShowScrapFormModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOperatorData = async () => {
      try {
        if (!stations || !shift?.shiftName) return;
        const response = await fetch(
          `http://localhost:5000/api/operators/specific?stations=${stations}&shift=${shift.shiftName}`
        );
        if (!response.ok) throw new Error("Failed to fetch operators");
        const data = await response.json();

        const operatorsData = Array.isArray(data)
          ? data.map((item: any) => ({
              id: item.id || 0,
              userId: item.userId || "",
              userName: item.userName || "Unknown",
              userImage: item.userImage || "",
            }))
          : [];

        setOperators(operatorsData);
        setStatusCounts((prev) => ({
          ...prev,
          operators: operatorsData.length,
          productChangeover: data.productChangeover || prev.productChangeover,
          downtime: data.downtime || prev.downtime,
          speedLoss: data.speedLoss || prev.speedLoss,
          scrap: data.scrap || prev.scrap,
          mail: data.mail || prev.mail,
        }));
        setError(null);
      } catch (error) {
        console.error("Error fetching operators data:", error);
        setError("Failed to fetch operators data.");
      }
    };
    fetchOperatorData();
  }, [stations, shift]);

  useEffect(() => {
    const fetchDowntimeRecordsData = async () => {
      try {
        if (!stations || !shift?.shiftName) return;
        const response = await fetch(
          `http://localhost:5000/api/downtimeProblem/specificDowntimeRecords?station=${stations}&shift=${shift.shiftName}`
        );
        if (!response.ok) throw new Error("Failed to fetch downtime records");
        const data = await response.json();

        const records = Array.isArray(data)
          ? data.map((item: any) => ({
              id: item.id || 0,
              startTime: item.startTime || "",
              endTime: item.endTime || "",
              problem_group: item.problem_group || "",
              problem_name: item.problem_name || "",
              location: item.location || "",
              planned_status: item.planned_status || "unplanned",
            }))
          : [];

        setDowntimeRecords(records);
        setStatusCounts((prev) => ({
          ...prev,
          downtime: records.length,
        }));
        setError(null);
      } catch (error) {
        console.error("Error fetching downtime records data:", error);
        setError("Failed to fetch downtime records.");
      }
    };

    fetchDowntimeRecordsData();
  }, [stations, shift]);

  useEffect(() => {
    const fetchProductRecordsData = async () => {
      try {
        if (!stations || !shift?.shiftName) return;
        const response = await fetch(
          `http://localhost:5000/api/products/specificProductRecords?station=${stations}&shift=${shift.shiftName}`
        );
        if (!response.ok) throw new Error("Failed to fetch product records");
        const data = await response.json();

        const records = Array.isArray(data)
          ? data.map((item: any) => ({
              id: item.id || 0,
              productId: item.productId || "",
              productName: item.productName || "",
              startTime: item.startTime || "",
              endTime: item.endTime || "",
              stations: item.stations || stations,
              shift: item.shift || shift.shiftName,
            }))
          : [];

        setProductRecords(records);
        setStatusCounts((prev) => ({
          ...prev,
          productChangeover: records.length,
        }));
        setError(null);
      } catch (error) {
        console.error("Error fetching product records data:", error);
        setError("Failed to fetch product records.");
      }
    };

    fetchProductRecordsData();
  }, [stations, shift]);

  useEffect(() => {
    const fetchScrapRecordsData = async () => {
      try {
        if (!stations || !shift?.shiftName) return;
        const response = await fetch(
          `http://localhost:5000/api/scrapReasons/scrap?station=${encodeURIComponent(stations)}&shift=${encodeURIComponent(shift.shiftName)}`
        );
        if (!response.ok) throw new Error("Failed to fetch scrap records");
        const data = await response.json();

        const records = Array.isArray(data)
          ? data.map((item: any) => ({
              id: item.id || 0,
              start_time: item.start_time || "",
              end_time: item.end_time || "",
              scrap_qty: item.scrap_qty || 0,
              scrap_reason: item.scrap_reason || "",
              production_date: item.production_date || "",
              shift: item.shift || "",
              station: item.station || "",
              location: item.location || "",
              creator: item.creator || "",
              is_active: item.is_active,
              sys_date_time: item.sys_date_time,
              updated_at: item.updated_at,
            }))
          : [];

        setScrapRecords(records);
        setStatusCounts((prev) => ({
          ...prev,
          scrap: records.length,
        }));
        setError(null);
      } catch (error) {
        console.error("Error fetching scrap records data:", error);
        setError("Failed to fetch scrap records.");
      }
    };

    fetchScrapRecordsData();
  }, [stations, shift]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (!stations) return;
        const response = await fetch(`http://localhost:5000/api/products/specific?stations=${encodeURIComponent(stations)}`);
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();

        const productsData = Array.isArray(data)
          ? data.map((item: any) => ({
              id: item.id || 0,
              productName: item.productName || "",
              productCode: item.productCode || "",
              productGroup: item.productGroup || "",
              cycleTime: item.cycleTime || "",
              unitsPerSensorSignal: item.unitsPerSensorSignal || "",
              stations: item.stations || stations,
            }))
          : [];

        setProducts(productsData);
        setError(null);
      } catch (error) {
        console.error("Error fetching products:", error);
        setError("Failed to fetch products.");
      }
    };

    fetchProducts();
  }, [stations]);

  const refreshDowntimeRecords = async () => {
    try {
      if (!stations || !shift?.shiftName) return;
      const response = await fetch(
        `http://localhost:5000/api/downtimeProblem/specificDowntimeRecords?station=${encodeURIComponent(stations)}&shift=${encodeURIComponent(shift.shiftName)}`
      );
      if (!response.ok) throw new Error("Failed to refresh downtime records");
      const data = await response.json();

      const records = Array.isArray(data)
        ? data.map((item: any) => ({
            id: item.id || 0,
            startTime: item.startTime || "",
            endTime: item.endTime || "",
            problem_group: item.problem_group || "",
            problem_name: item.problem_name || "",
            location: item.location || "",
            planned_status: item.planned_status || "unplanned",
          }))
        : [];

      setDowntimeRecords(records);
      setStatusCounts((prev) => ({
        ...prev,
        downtime: records.length,
      }));
      setError(null);
    } catch (error) {
      console.error("Error refreshing downtime records:", error);
      setError("Failed to refresh downtime records.");
    }
  };

  const refreshProductRecords = async () => {
    try {
      if (!stations || !shift?.shiftName) return;
      const response = await fetch(
        `http://localhost:5000/api/products/specificProductRecords?station=${encodeURIComponent(stations)}&shift=${encodeURIComponent(shift.shiftName)}`
      );
      if (!response.ok) throw new Error("Failed to refresh product records");
      const data = await response.json();

      const records = Array.isArray(data)
        ? data.map((item: any) => ({
            id: item.id || 0,
            productId: item.productId || "",
            productName: item.productName || "",
            startTime: item.startTime || "",
            endTime: item.endTime || "",
            stations: item.stations || stations,
            shift: item.shift || shift.shiftName,
          }))
        : [];

      setProductRecords(records);
      setStatusCounts((prev) => ({
        ...prev,
        productChangeover: records.length,
      }));
      setError(null);
    } catch (error) {
      console.error("Error refreshing product records:", error);
      setError("Failed to refresh product records.");
    }
  };

  const refreshScrapRecords = async () => {
    try {
      if (!stations || !shift?.shiftName) return;
      const response = await fetch(
        `http://localhost:5000/api/scrapReasons/scrap?station=${encodeURIComponent(stations)}&shift=${encodeURIComponent(shift.shiftName)}`
      );
      if (!response.ok) throw new Error("Failed to refresh scrap records");
      const data = await response.json();

      const records = Array.isArray(data)
        ? data.map((item: any) => ({
            id: item.id || 0,
            start_time: item.start_time || "",
            end_time: item.end_time || "",
            scrap_qty: item.scrap_qty || 0,
            scrap_reason: item.scrap_reason || "",
            production_date: item.production_date || "",
            shift: item.shift || "",
            station: item.station || "",
            location: item.location || "",
            creator: item.creator || "",
            is_active: item.is_active,
            sys_date_time: item.sys_date_time,
            updated_at: item.updated_at,
          }))
        : [];

      setScrapRecords(records);
      setStatusCounts((prev) => ({
        ...prev,
        scrap: records.length,
      }));
      setError(null);
    } catch (error) {
      console.error("Error refreshing scrap records:", error);
      setError("Failed to refresh scrap records.");
    }
  };

  return (
    <>
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg flex items-center gap-2 mb-4 animate-pulse">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
      
      <div className="bg-gray-900 border-t border-transparent bg-gradient-to-r from-green-500/20 to-indigo-500/20 px-6 py-4 flex flex-wrap gap-6 items-center justify-between rounded-b-xl shadow-lg">
        <StatusItem
          icon={Users}
          label="Operators"
          count={statusCounts.operators}
          onClick={() => setShowOperatorModal(true)}
        />
        <StatusItem
          icon={RefreshCw}
          label="Product Changeover"
          count={statusCounts.productChangeover}
          onClick={() => setShowProductRecordsModal(true)}
        />
        <StatusItem
          icon={Clock}
          label="Downtime"
          count={statusCounts.downtime}
          onClick={() => setShowDowntimeRecordsModal(true)}
        />
        <StatusItem
          icon={Zap}
          label="Speed Loss"
          count={statusCounts.speedLoss}
        />
        <StatusItem
          icon={Trash}
          label="Scrap"
          count={statusCounts.scrap}
          onClick={() => setShowScrapRecordsModal(true)}
        />
        <StatusItem
          icon={Mail}
          label="Mail"
          count={statusCounts.mail}
        />
      </div>

      {showOperatorModal && (
        <OperatorModal operators={operators} onClose={() => setShowOperatorModal(false)} />
      )}
      
      {showProductRecordsModal && (
        <ProductRecordsModal
          products={products}
          stations={stations}
          shift={shift}
          productRecords={productRecords}
          onClose={() => setShowProductRecordsModal(false)}
          onSubmitSuccess={refreshProductRecords}
          onAdd={() => {
            setShowProductRecordsModal(false);
            setShowProductFormModal(true);
          }}
        />
      )}

      {showProductFormModal && (
        <ProductModal
          stations={stations}
          shift={shift}
          products={products}
          onClose={() => setShowProductFormModal(false)}
          onSubmitSuccess={refreshProductRecords}
        />
      )}

      {showDowntimeRecordsModal && (
        <DowntimeRecordsModal
          downtimeRecords={downtimeRecords}
          onAdd={() => {
            setShowDowntimeRecordsModal(false);
            setShowDowntimeFormModal(true);
          }}
          onClose={() => setShowDowntimeRecordsModal(false)}
          onUpdateSuccess={refreshDowntimeRecords}
          stations={stations}
          shift={shift}
          products={products}
        />
      )}

      {showDowntimeFormModal && (
        <DowntimeModal
          stations={stations}
          shift={shift}
          products={products}
          onClose={() => setShowDowntimeFormModal(false)}
          onSubmitSuccess={refreshDowntimeRecords}
        />
      )}

      {showScrapRecordsModal && (
        <ScrapRecordsModal
          scrapRecords={scrapRecords}
          onAdd={() => {
            setShowScrapRecordsModal(false);
            setShowScrapFormModal(true);
          }}
          onClose={() => setShowScrapRecordsModal(false)}
          onUpdateSuccess={refreshScrapRecords}
        />
      )}

      {showScrapFormModal && (
        <ScrapModal
          stations={stations}
          shift={shift}
          onClose={() => setShowScrapFormModal(false)}
          onSubmitSuccess={refreshScrapRecords}
        />
      )}
    </>
  );
}