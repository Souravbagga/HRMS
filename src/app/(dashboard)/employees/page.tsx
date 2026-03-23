"use client";

import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, MoreHorizontal, Eye, Edit2, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabaseClient";
import type { Employee } from "@/types";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmployees() {
      const supabase = createClient();
      const { data } = await supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });
      setEmployees(data ?? []);
      setLoading(false);
    }
    fetchEmployees();
  }, []);

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Employees</h1>
          <p className="text-muted-foreground mt-1">
            {loading ? "Loading..." : `Displaying ${filtered.length} of ${employees.length} records.`}
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

      <div className="flex bg-card flex-col border border-border/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border/40 bg-muted/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, email or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full bg-background/50 border-input/60 rounded-xl"
            />
          </div>
        </div>

        <div className="relative w-full overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Loading employees...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              {search ? "No employees match your search." : "No employees yet. Add your first employee."}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/40">
                  <TableHead className="w-75 font-bold text-foreground">Employee</TableHead>
                  <TableHead className="font-bold text-foreground">Department</TableHead>
                  <TableHead className="font-bold text-foreground">Designation</TableHead>
                  <TableHead className="font-bold text-foreground text-center">Status</TableHead>
                  <TableHead className="font-bold text-foreground">Joined</TableHead>
                  <TableHead className="text-right font-bold text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((employee) => (
                  <TableRow key={employee.id} className="group hover:bg-muted/20 transition-colors border-border/40">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                          <AvatarImage src="" alt={employee.name} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {employee.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground leading-none">{employee.name}</span>
                          <span className="text-xs text-muted-foreground mt-1">{employee.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{employee.department ?? "—"}</TableCell>
                    <TableCell className="font-medium">{employee.designation ?? "—"}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={
                          employee.status === "Active"
                            ? "rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none px-3"
                            : employee.status === "On Leave"
                            ? "rounded-lg bg-amber-500/10 text-amber-600 border-none px-3"
                            : "rounded-lg bg-slate-500/10 text-slate-600 border-none px-3"
                        }
                      >
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {employee.joining_date
                        ? new Date(employee.joining_date).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="rounded-xl w-40">
                          <DropdownMenuItem className="rounded-lg gap-2">
                            <Eye className="w-4 h-4" />
                            <Link href={`/employees/${employee.id}`} className="w-full">View Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg gap-2 text-primary focus:text-primary">
                            <Edit2 className="w-4 h-4" />
                            <span>Edit Profile</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
