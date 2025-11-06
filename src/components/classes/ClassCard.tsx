"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  UserCheck,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Calendar,
  GraduationCap,
} from "lucide-react";
import type { Class } from "@/domains/classes/types";

interface ClassCardProps {
  classData: Class;
  onEdit?: (classData: Class) => void;
  onDelete?: (classData: Class) => void;
  onViewDetails?: (classData: Class) => void;
}

// Vibrant gradient colors for class cards
const gradients = [
  "from-purple-500 to-pink-500",
  "from-blue-500 to-cyan-500",
  "from-green-500 to-emerald-500",
  "from-orange-500 to-red-500",
  "from-indigo-500 to-purple-500",
  "from-teal-500 to-green-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
];

// Generate consistent gradient based on class ID
function getGradient(id: string): string {
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

export function ClassCard({ classData, onEdit, onDelete, onViewDetails }: ClassCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const gradient = getGradient(classData.id);

  const handleCardClick = () => {
    router.push(`/classes/${classData.id}`);
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 group cursor-pointer" 
      onClick={handleCardClick}
    >
      {/* Gradient Header */}
      <div className={`h-32 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full"></div>
        
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <Badge 
            variant={classData.is_active ? "default" : "secondary"}
            className={classData.is_active 
              ? "bg-green-500/90 hover:bg-green-600 text-white border-0" 
              : "bg-gray-500/90 hover:bg-gray-600 text-white border-0"}
          >
            {classData.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Actions menu */}
        <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setMenuOpen(false); router.push(`/classes/${classData.id}`); }}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit?.(classData); }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete?.(classData); }}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Class icon */}
        <div className="absolute bottom-3 left-3">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-4">
        {/* Class name and section */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-1 line-clamp-1">
            {classData.name}
          </h3>
          {classData.section && (
            <p className="text-sm text-muted-foreground">
              Section {classData.section}
            </p>
          )}
        </div>

        {/* Description */}
        {classData.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {classData.description}
          </p>
        )}

        {/* Info badges */}
        <div className="flex flex-wrap gap-2">
          {classData.grade_level && (
            <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
              <GraduationCap className="h-3 w-3 mr-1" />
              Grade {classData.grade_level}
            </Badge>
          )}
          {classData.academic_year && (
            <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-700">
              <Calendar className="h-3 w-3 mr-1" />
              {classData.academic_year}
            </Badge>
          )}
        </div>

        {/* Stats - This would be populated if we fetch class details */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-foreground">
                {(classData as any).student_count || 0}
              </span>
              <span className="hidden sm:inline">Students</span>
            </div>
            <div className="flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-green-500" />
              <span className="font-medium text-foreground">
                {(classData as any).teacher_count || 0}
              </span>
              <span className="hidden sm:inline">Teachers</span>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); router.push(`/classes/${classData.id}`); }}
            className="text-xs hover:bg-primary/10 hover:text-primary"
          >
            View <Eye className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

