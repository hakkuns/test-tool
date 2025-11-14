'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Download, Upload, Play, Edit, Trash2, FileJson } from 'lucide-react'
import { scenariosApi } from '@/lib/api/scenarios'
import type { TestScenario } from '@/types/scenario'
import { toast } from 'sonner'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function ScenariosPage() {
	const router = useRouter()
	const [scenarios, setScenarios] = useState<TestScenario[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [scenarioToDelete, setScenarioToDelete] = useState<string | null>(null)

	// シナリオ一覧を取得
	const fetchScenarios = async () => {
		try {
			setIsLoading(true)
			const data = await scenariosApi.getAll()
			setScenarios(data)
		} catch (error) {
			toast.error('シナリオの取得に失敗しました')
			console.error(error)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		fetchScenarios()
	}, [])

	// シナリオ削除
	const handleDelete = async () => {
		if (!scenarioToDelete) return

		try {
			await scenariosApi.delete(scenarioToDelete)
			toast.success('シナリオを削除しました')
			await fetchScenarios()
		} catch (error) {
			toast.error('シナリオの削除に失敗しました')
			console.error(error)
		} finally {
			setDeleteDialogOpen(false)
			setScenarioToDelete(null)
		}
	}

	// シナリオエクスポート
	const handleExport = async (id: string) => {
		try {
			const exportData = await scenariosApi.exportScenario(id)
			scenariosApi.downloadAsJson(exportData)
			toast.success('シナリオをエクスポートしました')
		} catch (error) {
			toast.error('エクスポートに失敗しました')
			console.error(error)
		}
	}

	// 全シナリオエクスポート
	const handleExportAll = async () => {
		try {
			const exportData = await scenariosApi.exportAll()
			scenariosApi.downloadAllAsJson(exportData)
			toast.success('全シナリオをエクスポートしました')
		} catch (error) {
			toast.error('エクスポートに失敗しました')
			console.error(error)
		}
	}

	// シナリオインポート
	const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		try {
			await scenariosApi.importFromFile(file)
			toast.success('シナリオをインポートしました')
			await fetchScenarios()
		} catch (error) {
			toast.error('インポートに失敗しました')
			console.error(error)
		}

		// ファイル選択をリセット
		event.target.value = ''
	}

	// シナリオ適用
	const handleApply = async (id: string, name: string) => {
		if (!confirm(`シナリオ "${name}" を適用しますか？\n既存のテーブルとモックAPIに影響します。`)) {
			return
		}

		try {
			const result = await scenariosApi.apply(id)
			toast.success(
				`シナリオを適用しました\nテーブル: ${result.tablesCreated}個\nデータ: ${result.dataInserted}行\nモックAPI: ${result.mocksConfigured}個`
			)
		} catch (error) {
			toast.error('シナリオの適用に失敗しました')
			console.error(error)
		}
	}

	if (isLoading) {
		return (
			<div className="container mx-auto p-6">
				<div className="flex items-center justify-center h-64">
					<p className="text-muted-foreground">読み込み中...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* ヘッダー */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">テストシナリオ</h1>
					<p className="text-muted-foreground mt-1">
						テーブル、データ、モックAPIを統合管理
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={handleExportAll}>
						<Download className="h-4 w-4 mr-2" />
						全エクスポート
					</Button>
					<label htmlFor="import-file">
						<Button variant="outline" asChild>
							<span>
								<Upload className="h-4 w-4 mr-2" />
								インポート
							</span>
						</Button>
					</label>
					<input
						id="import-file"
						type="file"
						accept=".json"
						onChange={handleImport}
						className="hidden"
					/>
					<Button onClick={() => router.push('/scenarios/new')}>
						<Plus className="h-4 w-4 mr-2" />
						新規作成
					</Button>
				</div>
			</div>

			{/* シナリオ一覧 */}
			{scenarios.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center h-64">
						<FileJson className="h-12 w-12 text-muted-foreground mb-4" />
						<p className="text-muted-foreground mb-4">
							シナリオがまだありません
						</p>
						<Button onClick={() => router.push('/scenarios/new')}>
							<Plus className="h-4 w-4 mr-2" />
							最初のシナリオを作成
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{scenarios.map((scenario) => (
						<Card key={scenario.id} className="hover:shadow-lg transition-shadow">
							<CardHeader>
								<CardTitle className="flex items-start justify-between">
									<span className="flex-1">{scenario.name}</span>
								</CardTitle>
								{scenario.description && (
									<CardDescription>{scenario.description}</CardDescription>
								)}
							</CardHeader>
							<CardContent className="space-y-4">
								{/* API情報 */}
								<div className="text-sm">
									<div className="font-medium text-muted-foreground mb-1">
										テスト対象API
									</div>
									<div className="flex items-center gap-2">
										<Badge variant="outline">{scenario.targetApi.method}</Badge>
										<code className="text-xs">{scenario.targetApi.url}</code>
									</div>
								</div>

								{/* 統計情報 */}
								<div className="grid grid-cols-3 gap-2 text-xs">
									<div className="text-center p-2 bg-muted rounded">
										<div className="font-semibold">{scenario.tables.length}</div>
										<div className="text-muted-foreground">テーブル</div>
									</div>
									<div className="text-center p-2 bg-muted rounded">
										<div className="font-semibold">
											{scenario.tableData.reduce((sum, t) => sum + t.rows.length, 0)}
										</div>
										<div className="text-muted-foreground">データ行</div>
									</div>
									<div className="text-center p-2 bg-muted rounded">
										<div className="font-semibold">{scenario.mockApis.length}</div>
										<div className="text-muted-foreground">モックAPI</div>
									</div>
								</div>

								{/* タグ */}
								{scenario.tags.length > 0 && (
									<div className="flex flex-wrap gap-1">
										{scenario.tags.map((tag) => (
											<Badge key={tag} variant="secondary" className="text-xs">
												{tag}
											</Badge>
										))}
									</div>
								)}

								{/* アクション */}
								<div className="grid grid-cols-2 gap-2 pt-2">
									<Button
										size="sm"
										variant="default"
										onClick={() => handleApply(scenario.id, scenario.name)}
									>
										<Play className="h-3 w-3 mr-1" />
										適用
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={() => router.push(`/scenarios/${scenario.id}`)}
									>
										<Edit className="h-3 w-3 mr-1" />
										編集
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={() => handleExport(scenario.id)}
									>
										<Download className="h-3 w-3 mr-1" />
										Export
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={() => {
											setScenarioToDelete(scenario.id)
											setDeleteDialogOpen(true)
										}}
									>
										<Trash2 className="h-3 w-3 mr-1" />
										削除
									</Button>
								</div>

								{/* 作成日時 */}
								<div className="text-xs text-muted-foreground pt-2 border-t">
									作成: {new Date(scenario.createdAt).toLocaleString('ja-JP')}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* 削除確認ダイアログ */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>シナリオを削除しますか？</AlertDialogTitle>
						<AlertDialogDescription>
							この操作は取り消せません。シナリオのデータが完全に削除されます。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>キャンセル</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>削除</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
