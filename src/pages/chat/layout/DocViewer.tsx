import { useQuery } from "@tanstack/react-query";
import { fetchDocumentContent } from "@/services/documents.service";
import { useChatStore } from "@/store/chatStore";
import { FileText, X, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DocViewer() {
  // ✨ 스토어에서 선택된 참고문헌 정보 구독
  const { selectedReference, setSelectedReference } = useChatStore();

  // 닫기 버튼 핸들러
  const handleClose = () => {
    setSelectedReference(null);
  };

  // 문서 내용 가져오기 (선택된 문서가 있을 때만 실행)
  const { data: docContent, isLoading } = useQuery({
    queryKey: ["docContent", selectedReference?.sourceName],
    queryFn: () => {
      // 실제로는 doc_id가 필요합니다. 지금은 sourceName을 임시로 사용하거나
      // chatStore에 docId도 같이 저장해야 합니다.
      // 예시: user_id=2 (고정), doc_id=파일명(임시)
      return fetchDocumentContent("2", selectedReference?.sourceName || "");
    },
    enabled: !!selectedReference, // 선택되었을 때만 쿼리 실행
  });

  return (
    <div className="h-full rounded-xl flex flex-col bg-white border-l border-blue-50">
      {/* 헤더 영역 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-blue-100 h-14 shrink-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          {selectedReference ? (
            <>
              <Quote className="size-4 text-blue-600" />
              <span className="truncate max-w-[200px]">참고 문맥</span>
            </>
          ) : (
            <>
              <FileText className="size-4 text-slate-500" />
              <span>문서 미리보기</span>
            </>
          )}
        </div>

        {/* 닫기 버튼 (참고 모드일 때만 표시) */}
        {selectedReference && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 text-slate-400 hover:text-slate-700"
          >
            <X size={16} />
          </Button>
        )}
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex-1 overflow-hidden relative">
        {selectedReference ? (
          // ✨ [Mode 1] 참고 문맥 뷰어 (하이라이트 효과)
          <div className="h-full bg-slate-50/50 flex flex-col">
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-700 font-medium flex items-center gap-2">
              <FileText size={12} />
              출처 파일: {selectedReference.sourceName}
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
                <p className="text-sm leading-loose text-slate-700 font-serif">
                  {/* 텍스트 하이라이팅 효과 */}
                  <span className="bg-yellow-100 text-slate-900 px-1 py-0.5 rounded box-decoration-clone">
                    {selectedReference.text ||
                      "근거 텍스트를 불러올 수 없습니다."}
                  </span>
                </p>
              </div>
            </ScrollArea>
          </div>
        ) : (
          // ✨ [Mode 2] 기본 대기 화면 (PDF 미리보기용 placeholder)
          <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
            <FileText className="size-12 mb-3 opacity-20" />
            <p className="text-sm">채팅에서 출처를 클릭하면</p>
            <p className="text-xs opacity-70">여기에 관련 내용이 표시됩니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
