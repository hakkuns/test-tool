import { DDLUploader } from '@/components/tables/DDLUploader'
import { TableList } from '@/components/tables/TableList'

export default function TablesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">テーブル管理</h1>
        <p className="text-muted-foreground">
          PostgreSQL の CREATE TABLE 文を解析してテーブル定義を管理します
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DDLUploader />
        <TableList />
      </div>
    </div>
  )
}
