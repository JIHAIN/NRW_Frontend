import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, User, Camera, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useDialogStore } from "@/store/dialogStore";
import {
  updateMyInfoAPI,
  changePasswordAPI,
  uploadProfileImageAPI,
} from "@/services/user.service";

interface MyInfoModalProps {
  onClose: () => void;
}

type TabType = "INFO" | "PASSWORD" | "IMAGE";

export default function MyInfoModal({ onClose }: MyInfoModalProps) {
  const { user, accessToken, login } = useAuthStore();
  const dialog = useDialogStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabType>("INFO");
  const [isLoading, setIsLoading] = useState(false);

  // 기본 정보 상태
  const [userName, setUserName] = useState(user?.userName || "");

  // 비밀번호 변경 상태
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 프로필 이미지 상태
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    user?.profileImagePath || null
  );

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    return String(error);
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessToken || !user) {
      dialog.alert({
        message: "로그인 세션이 만료되었습니다.\n다시 로그인해주세요.",
        variant: "error",
      });
      return;
    }

    try {
      setIsLoading(true);

      await updateMyInfoAPI(accessToken, {
        payload: { user_name: userName, nickname: userName },
      });

      login({ ...user, userName }, accessToken, "");

      await dialog.alert({
        title: "수정 완료",
        message: "회원 정보가 수정되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("Update Info Error:", error);
      const message = getErrorMessage(error);
      dialog.alert({
        message: message || "정보 수정 중 오류가 발생했습니다.",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      dialog.alert({ message: "로그인이 필요합니다.", variant: "error" });
      return;
    }

    if (newPassword !== confirmPassword) {
      dialog.alert({
        message: "새 비밀번호가 일치하지 않습니다.",
        variant: "warning",
      });
      return;
    }

    try {
      setIsLoading(true);
      await changePasswordAPI(accessToken, {
        payload: { old_password: oldPassword, new_password: newPassword },
      });

      await dialog.alert({
        title: "변경 완료",
        message: "비밀번호가 변경되었습니다.",
        variant: "success",
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Change Password Error:", error);
      const message = getErrorMessage(error);
      dialog.alert({
        message: message || "비밀번호 변경 실패",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile || !accessToken) return;

    try {
      setIsLoading(true);
      await uploadProfileImageAPI(accessToken, selectedFile);

      await dialog.alert({
        title: "업로드 완료",
        message: "프로필 이미지가 변경되었습니다.",
        variant: "success",
      });
      onClose();
    } catch (error) {
      console.error("Image Upload Error:", error);
      const message = getErrorMessage(error);
      dialog.alert({
        message: message || "이미지 업로드 실패",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 mx-4">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">내 정보 관리</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("INFO")}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "INFO"
                ? "text-blue-600 border-blue-600 bg-blue-50/50"
                : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            기본 정보
          </button>
          <button
            onClick={() => setActiveTab("PASSWORD")}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "PASSWORD"
                ? "text-blue-600 border-blue-600 bg-blue-50/50"
                : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            비밀번호
          </button>
          <button
            onClick={() => setActiveTab("IMAGE")}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "IMAGE"
                ? "text-blue-600 border-blue-600 bg-blue-50/50"
                : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            프로필 사진
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {activeTab === "INFO" && (
            <form onSubmit={handleUpdateInfo} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  아이디
                </label>
                <input
                  type="text"
                  value={user?.accountId || ""}
                  disabled
                  className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                />
              </div>

              {/* [추가] 사원번호 필드 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  사원번호
                </label>
                <input
                  type="text"
                  value={user?.employeeId || "사원번호 없음"}
                  disabled
                  className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  이름
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none text-sm transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 flex justify-center items-center gap-2 font-medium text-sm mt-2"
              >
                {isLoading && <Loader2 className="animate-spin" size={16} />}
                저장하기
              </button>
            </form>
          )}

          {activeTab === "PASSWORD" && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  현재 비밀번호
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none text-sm transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !oldPassword || !newPassword}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 flex justify-center items-center gap-2 font-medium text-sm mt-2"
              >
                {isLoading && <Loader2 className="animate-spin" size={16} />}
                변경하기
              </button>
            </form>
          )}

          {activeTab === "IMAGE" && (
            <div className="space-y-6 flex flex-col items-center py-4">
              <div
                className="relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-50 flex items-center justify-center group-hover:brightness-90 transition-all">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={48} className="text-gray-300" />
                  )}
                </div>
                <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 transition-colors shadow-md border-2 border-white">
                  <Camera size={18} />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">
                  프로필 사진 변경
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  클릭하여 이미지를 선택하세요 (JPG, PNG)
                </p>
              </div>

              <button
                onClick={handleImageUpload}
                disabled={isLoading || !selectedFile}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 flex justify-center items-center gap-2 font-medium text-sm"
              >
                {isLoading && <Loader2 className="animate-spin" size={16} />}
                이미지 저장
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
