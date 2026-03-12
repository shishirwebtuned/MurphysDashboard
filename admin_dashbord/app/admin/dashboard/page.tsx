'use client';

import  { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Package,
  CheckCircle2,
  Bell,
  ArrowUpRight,
  Activity,
  Layers,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchDashboardStats } from '@/lib/redux/slices/dashboardSlicer';
import { format } from 'date-fns';
import Link from 'next/link';
import Header from '@/app/page/common/header';


export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Selectors from Redux
  const {
    totalProfiles,
    totalServices,
    totalAssigned,
    totalNotices,
    unreadNotices,
    totalCategories,
    activeService,
    inactiveService,
    recentAssign: recentAssignments,
    loading,
    error
  } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats(selectedFilter));
  }, [dispatch, selectedFilter]);
  
  // detect dark mode to style recharts tooltips accordingly
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    try {
      setIsDark(document.documentElement.classList.contains('dark'));
    } catch (e) {
      setIsDark(false);
    }
  }, []);

  const handleFilterChange = (value: string) => {
    setSelectedFilter(value);
  };

  const filterOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'last_90_days', label: 'Last 90 Days' },
  ];

  const stats = [
    {
      title: "Total Clients",
      value: totalProfiles?.toString() || "0",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Services",
      value: totalServices?.toString() || "0",
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-600/10",
    },
    {
      title: "Assigned Services",
      value: totalAssigned?.toString() || "0",
      icon: CheckCircle2,
      color: "text-blue-700",
      bg: "bg-blue-700/10",
    },
    {
      title: "Unread Notices",
      value: unreadNotices?.toString() || "0",
      icon: Bell,
      color: "text-blue-800",
      bg: "bg-blue-800/10",
    }
  ];

  return (
    <div className="space-y-10 min-h-screen bg-background transition-colors duration-200">
      {/* Header Section with Filter */}
        <Header
          title="Dashboard"
          description="Welcome back. Here's what's happening with your projects today."
          extra={
<>
              <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Showing data for: <span className="font-bold">{filterOptions.find(f => f.value === selectedFilter)?.label}</span>
          </span>
        </div>
      </motion.div>
               <div className="flex gap-2">
          <Select value={selectedFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px] border-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <SelectValue placeholder="Select period" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
</>
          }
        />
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
          <p className="font-semibold">Error loading dashboard</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      {!loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border  overflow-hidden shadow-none transition-all duration-200 relative group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className={` rounded-xl ${stat.bg} transition-transform group-hover:scale-110`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                  
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-bold text-foreground">{stat.value}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Stats Overview with Charts */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Services Distribution Pie Chart */}
            <Card className="border ">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Services Status
                </CardTitle>
                <CardDescription>Active vs Inactive breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Pie Chart */}
                  <div className="h-72 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Active', value: Number(activeService) || 0, color: '#3b82f6' },
                            { name: 'Inactive', value: Number(inactiveService) || 0, color: '#93c5fd' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent, payload, cx, cy, midAngle, innerRadius, outerRadius }) => {
                            // Safely handle possibly undefined values from Recharts (TypeScript strict)
                            const total = (Number(activeService) || 0) + (Number(inactiveService) || 0);
                            const val = payload?.value || 0;
                            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                            const RADIAN = Math.PI / 180;
                            const mAngle = typeof midAngle === 'number' ? midAngle : 0;
                            const oRadius = typeof outerRadius === 'number' ? outerRadius : 60;
                            const centerX = typeof cx === 'number' ? cx : 0;
                            const centerY = typeof cy === 'number' ? cy : 0;
                            const radius = oRadius + 25;
                            const x = centerX + radius * Math.cos(-mAngle * RADIAN);
                            const y = centerY + radius * Math.sin(-mAngle * RADIAN);
                            return (
                              <text
                                x={x}
                                y={y}
                                fill="currentColor"
                                textAnchor={x > centerX ? 'start' : 'end'}
                                dominantBaseline="central"
                                className="text-sm font-semibold"
                              >
                                {`${name} ${pct}%`}
                              </text>
                            );
                          }}
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Active', value: Number(activeService) || 0, color: '#3b82f6' },
                            { name: 'Inactive', value: Number(inactiveService) || 0, color: '#93c5fd' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : '#ffffff',
                            border: isDark ? 'none' : '1px solid rgba(0,0,0,0.06)',
                            borderRadius: 8,
                            color: isDark ? '#ffffff' : '#111827'
                          }}
                          itemStyle={{ color: isDark ? '#ffffff' : '#111827' }}
                          cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Stats Summary */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-1">
<p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
  Active
</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activeService}</p>
                      <p className="text-xs">
                        {totalServices > 0 ? `${Math.round((activeService / totalServices) * 100)}%` : '0%'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-300 inline-block" />
                        Inactive
                      </p>
                      <p className="text-2xl font-bold text-blue-400 dark:text-blue-300">{inactiveService}</p>
                      <p className="text-xs text-white">
                        {totalServices > 0 ? `${Math.round((inactiveService / totalServices) * 100)}%` : '0%'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notices Pie Chart */}
            <Card className="border ">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-500" />
                  Notices Status
                </CardTitle>
                <CardDescription>Read vs Unread breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Pie Chart */}
                  <div className="h-72 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Read', value: Math.max((Number(totalNotices) || 0) - (Number(unreadNotices) || 0), 0), color: '#3b82f6' },
                            { name: 'Unread', value: Number(unreadNotices) || 0, color: '#60a5fa' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent, payload, cx, cy, midAngle, innerRadius, outerRadius }) => {
                            const total = Math.max((Number(totalNotices) || 0), 0);
                            const val = payload?.value || 0;
                            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                            const RADIAN = Math.PI / 180;
                            const mAngle = typeof midAngle === 'number' ? midAngle : 0;
                            const oRadius = typeof outerRadius === 'number' ? outerRadius : 60;
                            const centerX = typeof cx === 'number' ? cx : 0;
                            const centerY = typeof cy === 'number' ? cy : 0;
                            const radius = oRadius + 25;
                            const x = centerX + radius * Math.cos(-mAngle * RADIAN);
                            const y = centerY + radius * Math.sin(-mAngle * RADIAN);
                            return (
                              <text
                                x={x}
                                y={y}
                                fill="currentColor"
                                textAnchor={x > centerX ? 'start' : 'end'}
                                dominantBaseline="central"
                                className="text-sm font-semibold"
                              >
                                {`${name} ${pct}%`}
                              </text>
                            );
                          }}
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Read', value: Math.max((Number(totalNotices) || 0) - (Number(unreadNotices) || 0), 0), color: '#3b82f6' },
                            { name: 'Unread', value: Number(unreadNotices) || 0, color: '#60a5fa' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : '#ffffff',
                            border: isDark ? 'none' : '1px solid rgba(0,0,0,0.06)',
                            borderRadius: 8,
                            color: isDark ? '#ffffff' : '#111827'
                          }}
                          itemStyle={{ color: isDark ? '#ffffff' : '#111827' }}
                          cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Stats Summary */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Read
                      </p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{Math.max(Number(totalNotices || 0) - Number(unreadNotices || 0), 0)}</p>
                      <p className="text-xs text-muted-foreground">
                        {Number(totalNotices || 0) > 0 ? `${Math.round((Math.max(Number(totalNotices || 0) - Number(unreadNotices || 0), 0) / Number(totalNotices || 0)) * 100)}%` : '0%'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        Unread
                      </p>
                      <p className="text-2xl font-bold text-blue-500 dark:text-blue-400">{Number(unreadNotices || 0)}</p>
                      <p className="text-xs text-muted-foreground">
                        {Number(totalNotices || 0) > 0 ? `${Math.round((Number(unreadNotices || 0) / Number(totalNotices || 0)) * 100)}%` : '0%'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Categories Overview */}
            <Card className="border   dark:from-blue-950/30 dark:to-blue-900/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-500" />
                  System Overview
                </CardTitle>
                <CardDescription>Total counts across system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg  border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Categories</p>
                        <p className="text-xs text-muted-foreground">Service categories</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalCategories}</p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg  border border-blue-300 dark:border-blue-700">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Total Profiles</p>
                        <p className="text-xs text-muted-foreground">User accounts</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalProfiles}</p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg  border border-blue-400 dark:border-blue-600">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
                        <Package className="w-6 h-6 text-blue-700 dark:text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Total Services</p>
                        <p className="text-xs text-muted-foreground">All services</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-500">{totalServices}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Assignments Table */}
          <Card className="border ">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Recent Assignments</CardTitle>
                <CardDescription>Latest services assigned to clients</CardDescription>
              </div>
              <Link href="/admin/view_assign_service">
                <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                  View All <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pb-4 font-semibold uppercase tracking-wider text-[11px]">Client</TableHead>
                      <TableHead className="pb-4 font-semibold uppercase tracking-wider text-[11px]">Service</TableHead>
                      <TableHead className="pb-4 font-semibold uppercase tracking-wider text-[11px]">Date</TableHead>
                      <TableHead className="pb-4 text-right font-semibold uppercase tracking-wider text-[11px]">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAssignments && recentAssignments.length > 0 ? (
                      recentAssignments.map((assign: any, index: number) => (
                        <motion.tr
                          key={assign._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="group hover:bg-muted/50 transition-colors border-b"
                        >
                          <TableCell className="py-4">
                            <div className="font-medium text-foreground">{assign.client_name}</div>
                            <div className="text-xs text-muted-foreground">{assign.email}</div>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="font-medium text-foreground">{assign.service_name}</span>
                          </TableCell>
                          <TableCell className="py-4 text-muted-foreground text-xs">
                            {assign.createdAt ? format(new Date(assign.createdAt), 'MMM dd, yyyy') : '-'}
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <span className="font-bold text-foreground">${assign.price || 0}</span>
                          </TableCell>
                        </motion.tr>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <Package className="w-12 h-12 text-muted-foreground/50" />
                            <p>No recent assignments found.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}