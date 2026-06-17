import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import {
	ArrowUpDown,
	Loader2,
	LogOut,
	ShieldCheck,
	Trash2,
} from "lucide-react";
import * as React from "react";

import { Button } from "#/components/ui/button.tsx";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table.tsx";
import {
	deleteContribution,
	getAdminStatus,
	listContributions,
	login,
	logout,
} from "../server/admin";

export const Route = createFileRoute("/admin")({
	loader: async () => {
		const { authed } = await getAdminStatus();
		if (!authed) return { authed: false as const };
		return { authed: true as const, contributions: await listContributions() };
	},
	component: AdminPage,
});

type Contribution = Awaited<ReturnType<typeof listContributions>>[number];

const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const dateFmt = new Intl.DateTimeFormat("en-US", {
	dateStyle: "medium",
	timeStyle: "short",
	timeZone: "UTC",
});

function AdminPage() {
	const data = Route.useLoaderData();
	if (!data.authed) return <LoginScreen />;
	return <Dashboard contributions={data.contributions} />;
}

function LoginScreen() {
	const router = useRouter();
	const [username, setUsername] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [error, setError] = React.useState<string | null>(null);
	const [submitting, setSubmitting] = React.useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSubmitting(true);
		setError(null);
		try {
			const res = await login({ data: { username, password } });
			if (res.ok) {
				await router.invalidate();
			} else {
				setError("Incorrect username or password.");
			}
		} catch {
			setError("Something went wrong. Please try again.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<form
				onSubmit={handleSubmit}
				className="soft-card w-full max-w-sm space-y-5 p-8"
			>
				<div className="flex flex-col items-center text-center">
					<span className="flex size-12 items-center justify-center rounded-full bg-sage text-primary-foreground">
						<ShieldCheck className="size-6" />
					</span>
					<h1 className="mt-3 font-display text-2xl font-bold">Admin access</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						This area is private. Please sign in.
					</p>
				</div>

				<div className="space-y-2">
					<Label htmlFor="username">Username</Label>
					<Input
						id="username"
						autoComplete="username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						required
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="password">Password</Label>
					<Input
						id="password"
						type="password"
						autoComplete="current-password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
				</div>

				{error && (
					<p className="text-sm font-medium text-destructive">{error}</p>
				)}

				<Button
					type="submit"
					className="w-full rounded-full"
					disabled={submitting}
				>
					{submitting && <Loader2 className="size-4 animate-spin" />}
					Sign in
				</Button>
			</form>
		</div>
	);
}

function Dashboard({ contributions }: { contributions: Contribution[] }) {
	const router = useRouter();
	const [sorting, setSorting] = React.useState<SortingState>([
		{ id: "createdAt", desc: true },
	]);
	const [pendingDelete, setPendingDelete] = React.useState<Contribution | null>(
		null,
	);
	const [deleting, setDeleting] = React.useState(false);

	const total = contributions.reduce((sum, c) => sum + c.amount, 0);

	async function handleLogout() {
		await logout();
		await router.invalidate();
	}

	async function confirmDelete() {
		if (!pendingDelete) return;
		setDeleting(true);
		try {
			await deleteContribution({ data: { id: pendingDelete.id } });
			setPendingDelete(null);
			await router.invalidate();
		} finally {
			setDeleting(false);
		}
	}

	const columns = React.useMemo<ColumnDef<Contribution>[]>(
		() => [
			{
				accessorKey: "itemName",
				header: ({ column }) => <SortHeader column={column}>Gift</SortHeader>,
				cell: ({ row }) => (
					<span className="font-medium">{row.original.itemName}</span>
				),
			},
			{
				accessorKey: "name",
				header: "From",
				cell: ({ row }) =>
					row.original.name ?? (
						<span className="text-muted-foreground">Anonymous</span>
					),
			},
			{
				accessorKey: "amount",
				header: ({ column }) => <SortHeader column={column}>Amount</SortHeader>,
				cell: ({ row }) => (
					<span className="font-semibold text-sage-deep">
						{money(row.original.amount)}
					</span>
				),
			},
			{
				accessorKey: "note",
				header: "Note",
				enableSorting: false,
				cell: ({ row }) =>
					row.original.note ? (
						<span className="line-clamp-2 max-w-xs text-sm">
							{row.original.note}
						</span>
					) : (
						<span className="text-muted-foreground">—</span>
					),
			},
			{
				accessorKey: "createdAt",
				header: ({ column }) => (
					<SortHeader column={column}>Timestamp</SortHeader>
				),
				cell: ({ row }) => (
					<span className="whitespace-nowrap text-sm text-muted-foreground">
						{dateFmt.format(row.original.createdAt)}
					</span>
				),
			},
			{
				id: "actions",
				header: "",
				enableSorting: false,
				cell: ({ row }) => (
					<Button
						variant="ghost"
						size="icon-sm"
						className="text-muted-foreground hover:text-destructive"
						onClick={() => setPendingDelete(row.original)}
						aria-label="Delete contribution"
					>
						<Trash2 className="size-4" />
					</Button>
				),
			},
		],
		[],
	);

	const table = useReactTable({
		data: contributions,
		columns,
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	return (
		<div className="page-wrap py-10">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="font-display text-2xl font-bold">Contributions</h1>
					<p className="text-sm text-muted-foreground">
						{contributions.length}{" "}
						{contributions.length === 1 ? "contribution" : "contributions"} ·{" "}
						{money(total)} raised in total
					</p>
				</div>
				<Button
					variant="outline"
					className="rounded-full"
					onClick={handleLogout}
				>
					<LogOut className="size-4" />
					Log out
				</Button>
			</div>

			<div className="soft-card overflow-hidden">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((hg) => (
							<TableRow key={hg.id}>
								{hg.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-32 text-center text-muted-foreground"
								>
									No contributions yet.
								</TableCell>
							</TableRow>
						) : (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			<Dialog
				open={pendingDelete !== null}
				onOpenChange={(open) => !open && setPendingDelete(null)}
			>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Delete this contribution?</DialogTitle>
						<DialogDescription>
							{pendingDelete && (
								<>
									{money(pendingDelete.amount)} toward{" "}
									<span className="font-semibold text-foreground">
										{pendingDelete.itemName}
									</span>
									{pendingDelete.name ? ` from ${pendingDelete.name}` : ""}.
									This can't be undone.
								</>
							)}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2 sm:gap-2">
						<DialogClose asChild>
							<Button variant="ghost" className="rounded-full">
								Cancel
							</Button>
						</DialogClose>
						<Button
							variant="destructive"
							className="rounded-full"
							onClick={confirmDelete}
							disabled={deleting}
						>
							{deleting && <Loader2 className="size-4 animate-spin" />}
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function SortHeader({
	column,
	children,
}: {
	column: import("@tanstack/react-table").Column<Contribution, unknown>;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			className="-ml-1 inline-flex items-center gap-1 rounded px-1 font-medium hover:text-foreground"
			onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
		>
			{children}
			<ArrowUpDown className="size-3.5 opacity-60" />
		</button>
	);
}
