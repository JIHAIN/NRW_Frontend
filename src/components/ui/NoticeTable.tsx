export function NoticeTable({
  data,
}: {
  data: { title: string; date: string; category: string; link: string }[];
}) {
  return (
    <table className="min-w-full border border-gray-200 text-sm">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 text-left">분류</th>
          <th className="p-2 text-left">제목</th>
          <th className="p-2 text-left">일정</th>
          <th className="p-2 text-left">보기</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, i) => (
          <tr key={i} className="border-t hover:bg-gray-50">
            <td className="p-2">{item.category}</td>
            <td className="p-2">{item.title}</td>
            <td className="p-2">{item.date}</td>
            <td className="p-2 text-blue-600 underline cursor-pointer">
              <a href={item.link}>링크</a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
