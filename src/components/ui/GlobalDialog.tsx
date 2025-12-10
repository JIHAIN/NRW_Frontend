// src/components/ui/GlobalDialog.tsx
import { useDialogStore } from "@/store/dialogStore";
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

export function GlobalDialog() {
  const { isOpen, type, options, close } = useDialogStore();

  if (!isOpen) return null;

  // 아이콘 및 색상 결정
  const getVariantStyles = () => {
    switch (options.variant) {
      case "success":
        return {
          icon: <CheckCircle2 className="w-10 h-10 text-green-500" />,
          btn: "bg-green-600 hover:bg-green-700",
        };
      case "error":
        return {
          icon: <XCircle className="w-10 h-10 text-red-500" />,
          btn: "bg-red-600 hover:bg-red-700",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-10 h-10 text-orange-500" />,
          btn: "bg-orange-600 hover:bg-orange-700",
        };
      default: // info
        return {
          icon: <AlertCircle className="w-10 h-10 text-blue-500" />,
          btn: "bg-blue-600 hover:bg-blue-700",
        };
    }
  };

  const style = getVariantStyles();

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 transform transition-all scale-100 animate-in zoom-in-95 duration-200 border border-gray-100">
        <div className="flex flex-col items-center text-center gap-4">
          {/* 아이콘 */}
          <div className="p-3 bg-gray-50 rounded-full">{style.icon}</div>

          {/* 텍스트 */}
          <div className="space-y-2">
            {options.title && (
              <h3 className="text-lg font-bold text-gray-900">
                {options.title}
              </h3>
            )}
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
              {options.message}
            </p>
          </div>

          {/* 버튼 영역 */}
          <div className="flex gap-3 w-full mt-2">
            {type === "confirm" && (
              <button
                onClick={() => close(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            )}
            <button
              onClick={() => close(true)}
              className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all active:scale-95 ${style.btn}`}
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
