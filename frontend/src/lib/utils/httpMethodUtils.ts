/**
 * HTTPメソッドに対応する色クラスを取得
 */
export function getMethodColor(method: string): string {
  switch (method) {
    case "GET":
      return "bg-blue-500 text-white border-blue-500";
    case "POST":
      return "bg-green-500 text-white border-green-500";
    case "PUT":
      return "bg-yellow-500 text-white border-yellow-500";
    case "PATCH":
      return "bg-purple-500 text-white border-purple-500";
    case "DELETE":
      return "bg-red-500 text-white border-red-500";
    default:
      return "bg-gray-500 text-white border-gray-500";
  }
}
