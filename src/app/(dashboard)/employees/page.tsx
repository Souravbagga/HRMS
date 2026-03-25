"use client";

import { useEffect, useState, useCallback } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { DataTable, type Column } from "@/components/ui/data-table";
import type { Employee } from "@/types";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setEmployees(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const columns: Column<Employee>[] = [
    {
      key: "name",
      header: "Employee",
      sortable: true,
      sortFn: (a, b) => a.name.localeCompare(b.name),
      headerClassName: "w-[280px]",
      cell: (emp) => (
        <Link href={`/employees/${emp.id}`} className="flex items-center gap-3 group/link">
          <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
            <AvatarImage src="" alt={emp.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
              {emp.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-foreground leading-none group-hover/link:text-primary transition-colors">{emp.name}</span>
            <span className="text-xs text-muted-foreground mt-1 truncate">{emp.email}</span>
          </div>
        </Link>
      ),
    },
    {
      key: "department",
      header: "Department",
      sortable: true,
      sortFn: (a, b) => (a.department ?? "").localeCompare(b.department ?? ""),
      cell: (emp) => <span className="font-medium text-sm">{emp.department ?? "—"}</span>,
    },
    {
      key: "designation",
      header: "Designation",
      cell: (emp) => <span className="font-medium text-sm">{emp.designation ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center",
      className: "text-center",
      sortable: true,
      sortFn: (a, b) => a.status.localeCompare(b.status),
      cell: (emp) => (
        <Badge
          className={
            emp.status === "Active"
              ? "rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none px-3"
              : emp.status === "On Leave"
              ? "rounded-lg bg-amber-500/10 text-amber-600 border-none px-3"
              : "rounded-lg bg-slate-500/10 text-slate-600 border-none px-3"
          }
        >
          {emp.status}
        </Badge>
      ),
    },
    {
      key: "joining_date",
      header: "Joined",
      sortable: true,
      sortFn: (a, b) => new Date(a.joining_date ?? 0).getTime() - new Date(b.joining_date ?? 0).getTime(),
      cell: (emp) => (
        <span className="text-muted-foreground text-sm">
          {emp.joining_date
            ? new Date(emp.joining_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-[100px]",
      className: "text-right",
      cell: (emp) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/employees/${emp.id}`}
            className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/5"
          >
            View
          </Link>
          <Link
            href={`/employees/${emp.id}/edit`}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-lg hover:bg-primary/5"
          >
            Edit
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Employees</h1>
          <p className="text-muted-foreground mt-1">
            {loading ? "Loading..." : `${employees.length} total employees`}
          </p>
        </div>
        <Link
          href="/employees/new"
          className={buttonVariants({ variant: "default", className: "rounded-xl shadow-md min-w-35" })}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={employees}
        loading={loading}
        error={error}
        onRetry={fetchEmployees}
        searchPlaceholder="Search by name, email or department..."
        searchFn={(emp, q) =>
          emp.name.toLowerCase().includes(q) ||
          emp.email.toLowerCase().includes(q) ||
          (emp.department?.toLowerCase().includes(q) ?? false)
        }
        emptyTitle="No employees yet"
        emptyDescription="Get started by adding your first employee."
        emptyIcon={Users}
      />
    </div>
  );
}
