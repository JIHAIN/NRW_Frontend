import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function NoticeCard({
  title,
  summary,
  date,
  link,
}: {
  title: string;
  summary: string;
  date: string;
  link: string;
}) {
  return (
    <Card className="w-full max-w-md shadow-md hover:shadow-lg transition">
      <CardHeader className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <Calendar className="w-4 h-4 text-gray-500" />
      </CardHeader>

      <CardContent>
        <p className="text-sm text-gray-600">{summary}</p>
      </CardContent>

      <CardFooter className="flex justify-between text-sm text-gray-500">
        <span>📅 {date}</span>
        <a href={link} className="text-blue-600 hover:underline">
          자세히 보기
        </a>
      </CardFooter>
    </Card>
  );
}
