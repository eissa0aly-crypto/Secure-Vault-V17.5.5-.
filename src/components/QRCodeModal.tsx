import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { X, Copy, Check, Download, RefreshCw, Eye, EyeOff } from "lucide-react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
  title: string;
  category?: string;
}

export default function QRCodeModal({
  isOpen,
  onClose,
  text,
  title,
  category,
}: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [isInverted, setIsInverted] = useState(false); // false = black QR on white card, true = styled neon QR on dark card
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && canvasRef.current && text) {
      QRCode.toCanvas(
        canvasRef.current,
        text,
        {
          width: 256,
          margin: 2,
          color: {
            dark: isInverted ? "#00f0ff" : "#000000", // neon-cyan when inverted, classic black otherwise for optimal contrast
            light: isInverted ? "#0d1527" : "#ffffff", // dark deep slate when inverted, pure white otherwise
          },
        },
        (error) => {
          if (error) console.error("Error generating QR code:", error);
        }
      );
    }
  }, [isOpen, text, isInverted]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `qrcode-${title.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = url;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div 
        className="relative w-full max-w-md glass border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <div className="text-right">
            <h3 className="text-lg font-bold text-white">رمز الاستجابة السريعة QR</h3>
            <p className="text-xs text-gray-400">مسح آمن للمفاتيح والرموز</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          {/* Target Info */}
          <div className="text-center mb-5 w-full">
            <span className="text-xs bg-[rgba(0,255,255,0.1)] text-[var(--color-neon-blue)] border border-[rgba(0,255,255,0.2)] px-2.5 py-1 rounded-full font-medium mb-1 inline-block">
              {category || "مفتاح آمن"}
            </span>
            <h4 className="text-lg font-bold text-white truncate px-4">{title}</h4>
          </div>

          {/* QR Code Canvas Frame */}
          <div className="relative p-4 rounded-xl border border-white/10 bg-slate-900/40 flex items-center justify-center shadow-inner">
            <canvas
              ref={canvasRef}
              className="rounded-lg shadow-lg border border-black/10"
              style={{ width: "220px", height: "220px" }}
            />
          </div>

          {/* QR Controls */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setIsInverted(!isInverted)}
              className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
              title="تغيير ألوان الرمز لتحسين المسح في البيئات المختلفة"
            >
              <RefreshCw size={14} />
              <span>تبديل المظهر</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
              title="تحميل كصورة PNG"
            >
              <Download size={14} />
              <span>تحميل PNG</span>
            </button>
          </div>

          {/* Value display for verification */}
          <div className="w-full mt-6 bg-black/40 border border-white/5 rounded-xl p-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-gray-400 font-medium">القيمة السرية</span>
              <button
                onClick={() => setRevealed(!revealed)}
                className="text-xs text-[var(--color-neon-blue)] hover:underline flex items-center gap-1"
              >
                {revealed ? (
                  <>
                    <EyeOff size={12} />
                    <span>إخفاء</span>
                  </>
                ) : (
                  <>
                    <Eye size={12} />
                    <span>عرض</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex items-center gap-2 justify-between">
              <div 
                className="font-mono text-sm text-gray-300 truncate select-all flex-1 text-left" 
                dir="ltr"
              >
                {revealed ? text : "••••••••••••••••••••••••••••••••"}
              </div>
              <button
                onClick={handleCopy}
                className={`p-1.5 rounded-lg transition-all ${
                  copied 
                    ? "bg-[rgba(57,255,20,0.15)] text-[var(--color-neon-green)]" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
                title="نسخ النص"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Guide Note */}
          <p className="text-center text-xs text-gray-400 mt-5 leading-relaxed">
            استخدم كاميرا الهاتف أو تطبيق قارئ الـ QR لمسح الرمز مباشرة.
            <br />
            تتم عملية التوليد محلياً بالكامل على جهازك لضمان السرية المطلقة.
          </p>
        </div>
      </div>
    </div>
  );
}
