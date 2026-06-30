"use client";

import * as React from "react";
import { DataTable, Column } from "../data-table";
import { fetchAllUsers, UserProfile, adminUpdateUser } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { EditUserModal } from "../edit-user-modal";
import { NavigationTabs } from "../navigation-tabs";

interface UsersModuleProps {
  idToken?: string;
  profile?: {
    email: string;
    role: string;
  } | null;
}

// Global in-memory cache to store user profiles
let usersCache: any[] | null = null;

export function UsersModule({ idToken = "simulated-id-token", profile }: UsersModuleProps) {
  const [users, setUsers] = React.useState<any[]>(() => usersCache || []);
  const [fetching, setFetching] = React.useState(!usersCache);
  const [activeTab, setActiveTab] = React.useState<"Users" | "Pending" | "Block">("Users");
  const [editingUser, setEditingUser] = React.useState<any | null>(null);

  const columns: Column[] = [
    { id: "email", header: "Email", accessor: "email" },
    { id: "name", header: "Full Name", accessor: "name" },
    { id: "phone_number", header: "Phone Number", accessor: "phone_number" },
    { id: "role", header: "Security Role", accessor: "role" },
    { id: "active", header: "Approval Status", accessor: "active_label" },
  ];

  const loadUsers = React.useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setFetching(true);
    }
    try {
      const myEmail = profile?.email || "admin@hsg-global.com";
      const data = await fetchAllUsers(idToken, myEmail);
      // Map active numeric status to label, and set row ID to email (required by DataTable primary key check)
      const mapped = data.map((u) => ({
        ...u,
        id: u.email,
        active_label: u.active === 1 ? "Active" : u.active === 0 ? "Pending" : "Blocked",
      }));
      setUsers(mapped);
      usersCache = mapped;
    } catch (err: any) {
      showToast(err.message || "Failed to load users database", "error");
    } finally {
      setFetching(false);
    }
  }, [idToken, profile]);

  React.useEffect(() => {
    const hasCache = usersCache !== null;
    loadUsers(hasCache);
  }, [loadUsers]);

  const handleSaveModalUser = async (updatedUser: any) => {
    try {
      const myEmail = profile?.email || "admin@hsg-global.com";
      await adminUpdateUser(
        idToken,
        myEmail,
        updatedUser.email,
        updatedUser.role,
        updatedUser.pages_access || [],
        updatedUser.modules_access || [],
        updatedUser.active,
        updatedUser.name,
        updatedUser.phone_number
      );
      showToast(`User ${updatedUser.email} updated successfully!`, "success");
      loadUsers(true); // silent background load
    } catch (err: any) {
      showToast(err.message || "Failed to update user details", "error");
      throw err;
    }
  };

  if (profile?.role !== "Administrator") {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#E5E5E5] border border-zinc-300 rounded-lg shadow-sm font-primary">
        <span className="text-zinc-500 text-sm font-semibold italic text-center">
          Access Denied: Only Administrators can view or manage users.
        </span>
      </div>
    );
  }

  // Filter users based on active tab
  const filteredUsers = users.filter((u) => {
    if (activeTab === "Users") return u.active === 1;
    if (activeTab === "Pending") return u.active === 0;
    if (activeTab === "Block") return u.active === 2;
    return false;
  });

  const tabs = [
    { id: "Users", label: "Users", desc: "Manage system credentials and assign access permissions." },
    { id: "Pending", label: "Pending", desc: "Approve or reject new registrations waiting for activation." },
    { id: "Block", label: "Block", desc: "Blocked accounts with suspended system permissions." }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Reusable Sub-Navigation NavigationTabs Component */}
      <NavigationTabs 
        tabs={tabs}
        activeTabId={activeTab}
        onTabSelect={(tabId) => setActiveTab(tabId as any)}
        titleSuffix="Registry"
      />

      {/* Data Table */}
      <div className="w-full">
        <DataTable
          columns={columns}
          data={filteredUsers}
          userRole="admin"
          title={`${activeTab} Database Registry`}
          fetching={fetching}
          onEditRow={(row) => setEditingUser(row)}
          height="h-[calc(100vh-220px)]"
        />
      </div>

      {/* Edit User Modal Popup */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveModalUser}
        />
      )}
    </div>
  );
}
