"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  User,
  Settings,
  HelpCircle,
  Search,
  ChevronDown,
  LogOut,
  MessageSquare,
  Ruler,
  Table2,
  MapPin,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Righteous } from "next/font/google";
import { RestaurantLayout } from "../types/restaurant";

const righteous = Righteous({ subsets: ['latin'], weight: '400' });

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "info" | "warning" | "success" | "error";
}

interface UserData {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface RestaurantHeaderProps {
  layout: RestaurantLayout;
  userData?: UserData;
  notifications?: Notification[];
}

const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({
  layout,
  userData = {
    name: "User Name",
    email: "user@example.com",
    role: "Manager",
  },
  notifications = []
}) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(
    notifications.filter(n => !n.read).length
  );

  // Get table count from the current floor's layoutItems
  const tableCount = layout.floor.layoutItems.filter(item =>
    item.type.startsWith("table-")
  ).length;

  const markAsRead = (id: string) => {
    console.log(id);
    // In a real app, you would update the notification state
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-gradient-to-r from-orange-50 to-amber-50/70 border-b border-orange-200/50 backdrop-blur-xl supports-[backdrop-filter]:bg-orange-50/80 px-6 py-3 flex-shrink-0 sticky top-0 z-40 shadow-sm shadow-orange-200/30"
    >
      <div className="flex items-center justify-between">
        {/* Left section - Logo and layout info */}
        <div className="flex items-center gap-4">
          {/* Company Logo */}
          <motion.div
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2"
          >
            <motion.h1
              className={`text-4xl font-bold 
                  text-gray-900 dark:text-slate-100 
                  transition-all duration-300 
                  ${righteous?.className || ''}`}
              whileHover={{ scale: 1.02 }}
            >
              <span className="text-orange-500 dark:text-orange-400">O</span>rder
              <span className="text-orange-500 dark:text-orange-400">I</span>t
            </motion.h1>
          </motion.div>

          <div className="h-7 w-px bg-gradient-to-b from-orange-200/50 to-transparent" />

          <div className="min-w-0">
            <motion.h1
              className="text-lg font-semibold text-orange-900 truncate flex items-center gap-2"
              whileHover={{ x: 2 }}
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              {layout.name}
            </motion.h1>
            <div className="flex items-center gap-3 mt-1">
              <motion.p
                className="text-sm text-amber-700/90 truncate flex items-center gap-1.5"
                whileHover={{ scale: 1.02 }}
              >
                <MapPin className="h-3.5 w-3.5 text-amber-600" />
                {layout.floor.name}
              </motion.p>
              <Badge className="text-xs font-mono py-1 flex items-center gap-1 bg-amber-100 text-amber-800 border-amber-200/60 hover:bg-amber-200">
                <Ruler className="h-3 w-3 text-amber-600" />
                {layout.floor.width}×{layout.floor.height}px
              </Badge>
            </div>
          </div>
        </div>

        {/* Center section - Search */}
        <div className="flex-1 max-w-md mx-8">
          <motion.div
            animate={{ width: isSearchOpen ? "100%" : "44px" }}
            className="relative flex items-center"
          >
            {isSearchOpen ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full"
              >
                <Input
                  placeholder="Search layouts, tables, items..."
                  className="pr-10 transition-all bg-white border-amber-300/70 focus:border-amber-400 focus:ring-amber-300/30"
                  autoFocus
                  onBlur={() => setIsSearchOpen(false)}
                />
              </motion.div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: "rgba(251, 191, 36, 0.2)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSearchOpen(true)}
                className="h-10 w-11 rounded-xl bg-amber-100/50 border border-amber-200/50 flex items-center justify-center text-amber-700 hover:text-amber-800"
              >
                <Search className="h-4.5 w-4.5" />
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* Right section - Actions and user menu */}
        <div className="flex items-center gap-2.5">
          {/* Notifications */}
          <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
            <PopoverTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(251, 191, 36, 0.2)" }}
                whileTap={{ scale: 0.95 }}
                className="relative h-10 w-10 rounded-xl bg-amber-100/50 border border-amber-200/50 flex items-center justify-center text-amber-700 hover:text-amber-800"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs flex items-center justify-center shadow shadow-amber-500/50"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </motion.button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 border-amber-200/70 shadow-lg shadow-amber-200/20" align="end">
              <div className="flex items-center justify-between p-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50/50">
                <h4 className="font-semibold text-amber-900">Notifications</h4>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto bg-white">
                {notifications.length > 0 ? (
                  <div className="p-2">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded-xl mb-1.5 cursor-pointer transition-all ${notification.read ? "bg-white" : "bg-amber-50/70 border border-amber-100"}`}
                        onClick={() => markAsRead(notification.id)}
                        whileHover={{ y: -2, backgroundColor: "rgba(254, 243, 199, 0.5)" }}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-sm text-amber-900">
                            {notification.title}
                          </span>
                          <span className="text-xs text-amber-600/80">
                            {notification.time}
                          </span>
                        </div>
                        <p className="text-xs text-amber-700/80 mt-1">
                          {notification.description}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-amber-600/70">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50 text-amber-400" />
                    <p>No notifications yet</p>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Table counter */}
          <motion.div
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-100/50 border border-amber-200/50"
            whileHover={{ scale: 1.02, backgroundColor: "rgba(254, 243, 199, 0.7)" }}
          >
            <Table2 className="h-4 w-4 text-amber-700" />
            <span className="text-sm text-amber-800/90">Tables:</span>
            <span className="font-medium text-amber-900">{tableCount}</span>
          </motion.div>

          {/* Help */}
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "rgba(251, 191, 36, 0.2)" }}
            whileTap={{ scale: 0.95 }}
            className="h-10 w-10 rounded-xl bg-amber-100/50 border border-amber-200/50 flex items-center justify-center text-amber-700 hover:text-amber-800"
          >
            <HelpCircle className="h-5 w-5" />
          </motion.button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: "rgba(254, 243, 199, 0.5)" }}
                whileTap={{ scale: 0.98 }}
                className="relative h-10 px-3 rounded-xl bg-amber-100/50 border border-amber-200/50 gap-2 flex items-center"
              >
                <Avatar className="h-6 w-6 border border-amber-300/50">
                  <AvatarImage src={userData.avatar} alt={userData.name} />
                  <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs">
                    {userData.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline-block text-sm font-medium text-amber-900">
                  {userData.name}
                </span>
                <ChevronDown className="h-4 w-4 text-amber-700" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 border-amber-200/70 bg-white shadow-lg shadow-amber-200/20"
              align="end"
            >
              <DropdownMenuLabel className="bg-gradient-to-r from-amber-50 to-orange-50/50">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-amber-900">{userData.name}</p>
                  <p className="text-xs text-amber-600/80">
                    {userData.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-amber-100" />
              <DropdownMenuItem className="text-amber-800 focus:bg-amber-50 focus:text-amber-900">
                <User className="mr-2 h-4 w-4 text-amber-600" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-amber-800 focus:bg-amber-50 focus:text-amber-900">
                <Settings className="mr-2 h-4 w-4 text-amber-600" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-amber-800 focus:bg-amber-50 focus:text-amber-900">
                <MessageSquare className="mr-2 h-4 w-4 text-amber-600" />
                <span>Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-amber-100" />
              <DropdownMenuItem className="text-amber-800 focus:bg-amber-50 focus:text-amber-900">
                <LogOut className="mr-2 h-4 w-4 text-amber-600" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
};

export default RestaurantHeader;