"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, History } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { usePkl } from "@/hooks/usePkl";
import { PklFilters } from "@/components/admin/PklFilters";
import { PklManualDialog } from "@/components/admin/PklManualDialog";
import { PklTable } from "@/components/admin/PklTable";

export default function PKLMonitoringPage() {
  const {
    sidebarOpen,
    setSidebarOpen,
    isSidebarCollapsed,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    positions,
    loading,
    admin,
    isManualOpen,
    setIsManualOpen,
    isSubmitting,
    batchSurat,
    batchCommon,
    setBatchCommon,
    batchStudents,
    isEditOpen,
    setIsEditOpen,
    editForm,
    setEditForm,
    isDeleteOpen,
    setIsDeleteOpen,
    deletingIntern,
    setDeletingIntern,
    isLogoutOpen,
    setIsLogoutOpen,
    toggleSidebar,
    handleStartDateChange,
    handleDurationChange,
    isFormValid,
    addStudentField,
    updateStudent,
    removeStudentField,
    handleFileChange,
    handleBatchSubmit,
    onEditClick,
    handleEditSubmit,
    confirmDelete,
    groupedData,
  } = usePkl();

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 flex overflow-hidden">
      {/* SIDEBAR */}
      <AdminSidebar
        active="pkl"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        onLogout={() => setIsLogoutOpen(true)}
      />

      {/* CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* HEADER */}
        <AdminHeader
          title="Monitoring PKL"
          setSidebarOpen={setSidebarOpen}
          isSidebarCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          username={admin.username}
          jabatan={admin.jabatan}
        />

        <main className="flex-1 overflow-y-auto p-8 space-y-8 animate-in fade-in duration-500">
          <div className="w-full">
            <PklFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onOpenManualClick={() => setIsManualOpen(true)}
            />
          </div>

          <Tabs
            defaultValue="active"
            className="w-full"
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 mb-6 rounded-lg h-12 shadow-sm transition-colors">
              <TabsTrigger
                value="active"
                className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 font-medium rounded-md h-full transition-all dark:text-slate-400"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Sedang Magang</span>
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 font-medium rounded-md h-full transition-all dark:text-slate-400"
              >
                <History className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Magang Selesai</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-6">
              <PklTable
                positions={positions}
                loading={loading}
                groupedData={groupedData}
                searchTerm={searchTerm}
                activeTab="active"
                onEditClick={onEditClick}
                isEditOpen={isEditOpen}
                setIsEditOpen={setIsEditOpen}
                editForm={editForm}
                setEditForm={setEditForm}
                handleEditSubmit={handleEditSubmit}
                isDeleteOpen={isDeleteOpen}
                setIsDeleteOpen={setIsDeleteOpen}
                deletingIntern={deletingIntern}
                setDeletingIntern={setDeletingIntern}
                confirmDelete={confirmDelete}
                isLogoutOpen={isLogoutOpen}
                setIsLogoutOpen={setIsLogoutOpen}
                isSubmitting={isSubmitting}
              />
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <PklTable
                positions={positions}
                loading={loading}
                groupedData={groupedData}
                searchTerm={searchTerm}
                activeTab="history"
                onEditClick={onEditClick}
                isEditOpen={isEditOpen}
                setIsEditOpen={setIsEditOpen}
                editForm={editForm}
                setEditForm={setEditForm}
                handleEditSubmit={handleEditSubmit}
                isDeleteOpen={isDeleteOpen}
                setIsDeleteOpen={setIsDeleteOpen}
                deletingIntern={deletingIntern}
                setDeletingIntern={setDeletingIntern}
                confirmDelete={confirmDelete}
                isLogoutOpen={isLogoutOpen}
                setIsLogoutOpen={setIsLogoutOpen}
                isSubmitting={isSubmitting}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* DIALOG INPUT MANUAL */}
      <PklManualDialog
        isOpen={isManualOpen}
        onOpenChange={setIsManualOpen}
        positions={positions}
        batchCommon={batchCommon}
        setBatchCommon={setBatchCommon}
        batchStudents={batchStudents}
        addStudentField={addStudentField}
        updateStudent={updateStudent}
        removeStudentField={removeStudentField}
        batchSurat={batchSurat}
        handleFileChange={handleFileChange}
        handleStartDateChange={handleStartDateChange}
        handleDurationChange={handleDurationChange}
        handleBatchSubmit={handleBatchSubmit}
        isSubmitting={isSubmitting}
        isFormValid={isFormValid}
      />
    </div>
  );
}